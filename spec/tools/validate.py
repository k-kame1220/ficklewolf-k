#!/usr/bin/env python3
import hashlib
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
VERSION_LENGTH = 16
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


def master_version() -> str:
    digest = hashlib.sha256()
    for name in MASTER_FILES:
        digest.update(f"{name}.json\n".encode())
        digest.update((MASTER_DIR / f"{name}.json").read_bytes())
    return digest.hexdigest()[:VERSION_LENGTH]


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
    quest_ids = set(ids["quests"])
    weather_ids = set(ids["weathers"])
    quests_by_id = {q["id"]: q for q in master["quests"]}

    for q in master["quests"]:
        recruit = q["rewards"]["recruit"]
        if recruit is not None and recruit not in character_ids:
            errors.append(f"quests/{q['id']}: recruit '{recruit}' のキャラがいません")
        if q["kind"] == "weather" and q.get("weatherId") not in weather_ids:
            errors.append(f"quests/{q['id']}: weatherId '{q.get('weatherId')}' の天気がありません")
        for i, stage in enumerate(q["stages"]):
            if stage["battle"]["turns"][-1] != LAST_TURN_ACTION:
                errors.append(f"quests/{q['id']}: stages[{i}] の最後の行動が {LAST_TURN_ACTION} ではありません")

    for w in master["weathers"]:
        if w["questId"] not in quest_ids:
            errors.append(f"weathers/{w['id']}: questId '{w['questId']}' のクエストがありません")
        elif quests_by_id[w["questId"]].get("weatherId") != w["id"]:
            errors.append(f"weathers/{w['id']}: クエスト '{w['questId']}' の weatherId と一致しません")

    for kind in ["main", "event", "weather"]:
        orders = sorted(q["order"] for q in master["quests"] if q["kind"] == kind)
        if orders != list(range(1, len(orders) + 1)):
            errors.append(f"quests: {kind} の order が 1 から連番になっていません: {orders}")

    item_keys = Counter((i["attribute"], i["stat"]) for i in master["items"])
    errors += [f"items: {k} のアイテムが重複しています" for k, n in item_keys.items() if n > 1]

    rewards = master["settings"]["rewards"]
    if rewards["weatherItemDropMin"] > rewards["weatherItemDropMax"]:
        errors.append("settings: weatherItemDropMin が weatherItemDropMax より大きいです")

    for e in errors:
        print(f"NG {e}")
    print(f"master version: {master_version()}")
    print("OK" if not errors else f"{len(errors)} errors")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
