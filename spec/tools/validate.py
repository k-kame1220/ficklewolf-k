#!/usr/bin/env python3
import json
import sys
from collections import Counter
from pathlib import Path

from jsonschema import Draft202012Validator

SPEC_DIR = Path(__file__).resolve().parent.parent
MASTER_DIR = SPEC_DIR / "master"
MASTER_SCHEMA_DIR = MASTER_DIR / "schema"
BATTLE_DIR = SPEC_DIR / "battle"
MASTER_FILES = ["attributes", "characters", "items", "quests", "settings", "weathers"]
LAST_TURN_ACTION = "deathblow"


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def build_validator_factory():
    schemas = [load(p) for p in [*MASTER_SCHEMA_DIR.glob("*.schema.json"), BATTLE_DIR / "case.schema.json"]]
    try:
        from referencing import Registry, Resource

        registry = Registry().with_resources((s["$id"], Resource.from_contents(s)) for s in schemas)
        return lambda schema: Draft202012Validator(schema, registry=registry)
    except ImportError:
        from jsonschema import RefResolver

        store = {s["$id"]: s for s in schemas}
        return lambda schema: Draft202012Validator(schema, resolver=RefResolver.from_schema(schema, store=store))


def main() -> int:
    validator_for = build_validator_factory()
    errors = []

    master = {name: load(MASTER_DIR / f"{name}.json") for name in MASTER_FILES}
    for name, data in master.items():
        schema = load(MASTER_SCHEMA_DIR / f"{name}.schema.json")
        errors += [f"master/{name}.json: {e.json_path}: {e.message}" for e in validator_for(schema).iter_errors(data)]

    case_schema = load(BATTLE_DIR / "case.schema.json")
    for path in sorted((BATTLE_DIR / "cases").glob("*.json")):
        errors += [f"battle/cases/{path.name}: {e.json_path}: {e.message}"
                   for e in validator_for(case_schema).iter_errors(load(path))]

    ids = {name: [x["id"] for x in master[name]] for name in ["attributes", "characters", "items", "quests", "weathers"]}
    for name, values in ids.items():
        errors += [f"master/{name}.json: id '{v}' が重複しています" for v, n in Counter(values).items() if n > 1]

    character_ids = set(ids["characters"])
    items_by_id = {i["id"]: i for i in master["items"]}
    items_by_attribute_stat = {(i["attribute"], i["stat"]): i["id"] for i in master["items"]}

    for q in master["quests"]:
        recruit = q["rewards"]["recruit"]
        if recruit is not None and recruit not in character_ids:
            errors.append(f"quests/{q['id']}: recruit '{recruit}' のキャラがいません")
        drop = q["rewards"]["dropItemId"]
        if drop is not None and drop not in items_by_id:
            errors.append(f"quests/{q['id']}: dropItemId '{drop}' が items.json にありません")
        if q["kind"] != "weather" and drop is not None:
            errors.append(f"quests/{q['id']}: dropItemId はお天気クエストだけに書けます")
        for i, stage in enumerate(q["stages"]):
            if stage["battle"]["turns"][-1] != LAST_TURN_ACTION:
                errors.append(f"quests/{q['id']}: stages[{i}] の最後の行動が {LAST_TURN_ACTION} ではありません")

    weathers_by_id = {w["id"]: w for w in master["weathers"]}
    for q in master["quests"]:
        if q["kind"] != "weather":
            if "weatherId" in q:
                errors.append(f"quests/{q['id']}: weatherId はお天気クエストだけに書けます")
            continue
        weather = weathers_by_id.get(q.get("weatherId"))
        if weather is None:
            errors.append(f"quests/{q['id']}: weatherId '{q.get('weatherId')}' の天気がありません")
            continue
        bonus_stats = [stat for stat, value in weather["bonus"].items() if value != 0]
        expected = items_by_attribute_stat.get((weather["attribute"], bonus_stats[0])) if len(bonus_stats) == 1 else None
        if q["rewards"]["dropItemId"] != expected:
            errors.append(
                f"quests/{q['id']}: dropItemId は {json.dumps(expected)}"
                "（天気の属性 × ボーナスの付くステータス。ボーナスが無い天気は null）にしてください"
            )
    quests_per_weather = Counter(q.get("weatherId") for q in master["quests"] if q["kind"] == "weather")
    errors += [f"weathers/{w['id']}: お天気クエストが {quests_per_weather[w['id']]} 件あります（1 件にしてください）"
               for w in master["weathers"] if quests_per_weather[w["id"]] != 1]

    for kind in ["main", "event", "weather"]:
        orders = sorted(q["order"] for q in master["quests"] if q["kind"] == kind)
        if orders != list(range(1, len(orders) + 1)):
            errors.append(f"quests: {kind} の order が 1 から連番になっていません: {orders}")

    item_keys = Counter((i["attribute"], i["stat"]) for i in master["items"])
    errors += [f"items: {k} のアイテムが重複しています" for k, n in item_keys.items() if n > 1]

    starter = master["settings"]["starterCharacterId"]
    if starter not in character_ids:
        errors.append(f"settings: starterCharacterId '{starter}' のキャラがいません")

    item_ids = set(ids["items"])
    for starter_item in master["settings"]["starterItems"]:
        if starter_item["itemId"] not in item_ids:
            errors.append(f"settings: starterItems の '{starter_item['itemId']}' が items.json にありません")
    starter_item_ids = [i["itemId"] for i in master["settings"]["starterItems"]]
    errors += [f"settings: starterItems の '{v}' が重複しています" for v, n in Counter(starter_item_ids).items() if n > 1]

    rewards = master["settings"]["rewards"]
    if rewards["weatherItemDropMin"] > rewards["weatherItemDropMax"]:
        errors.append("settings: weatherItemDropMin が weatherItemDropMax より大きいです")

    for e in errors:
        print(f"NG {e}")
    print("OK" if not errors else f"{len(errors)} errors")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
