#!/usr/bin/env python3
import json
import re
from pathlib import Path

LEGACY_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = LEGACY_DIR / "data"
MASTER_DIR = LEGACY_DIR.parent / "spec" / "master"

JSON_INDENT = 2
MIN_APP_VERSION = "0.1.0"
FIRST_CLEAR_RECRUIT_RATE = 1
REPEAT_RECRUIT_RATE = 0.2
WEATHER_ITEM_DROP_MIN = 1
WEATHER_ITEM_DROP_MAX = 3
FUDA_PER_EVEN_LEVEL = 1
ITEM_USE_MAX = {"hp": 20, "attack": 16, "defence": 15}
ITEM_BONUS_PER_USE = {"hp": 42, "attack": 18, "defence": 2}
DUPLICATE_BONUS_PER_COUNT = {"hp": 14, "attack": 8, "defence": 2}

ATTRIBUTES = {
    "YANG": {"id": "yang", "name": "陽", "strongAgainst": "note"},
    "NOTE": {"id": "note", "name": "音", "strongAgainst": "moon"},
    "MOON": {"id": "moon", "name": "月", "strongAgainst": "yang"},
}
ENEMY_ACTIONS = {
    "攻撃": "attack", "防御": "defend", "攻撃バフ": "attackBuff", "防御バフ": "defenceBuff",
    "固定攻撃": "fixedAttack", "強攻撃": "strongAttack", "集中": "concentration", "必殺技": "deathblow",
    "挑発": "provocation", "全回復": "fullRecovery", "超回復": "rateRecovery", "属性変化": "changeAttribute",
    "ビリビリ": "numbness", "攻撃デバフ": "attackDebuff", "防御デバフ": "defenceDebuff",
}
CHARACTER_CATEGORIES = {
    "メインキャラクター": "main", "イベントキャラクター": "event", "ガチャ限定キャラクター": "gacha", "その他": "other",
}
QUEST_KINDS = {"メインクエスト": "main", "イベントクエスト": "event"}
STATS = {"HP": "hp", "ATK": "attack", "DEF": "defence"}
WEATHER_IDS = {
    "晴": "sunny", "曇": "cloudy", "雨": "rain", "雪": "snow", "霧": "fog", "嵐": "storm", "雷": "thunder",
    "闇": "dark", "青空": "blue-sky", "ガレオン船": "galleon", "メキシコ": "mexico", "縮地": "shukuchi",
}
IMAGE_VARIANTS = {"(アイコン)": "icon", "(ホーム)": "home"}


def to_id(name: str) -> str:
    return re.sub(r"[^a-z0-9-]", "-", name.lower())


def attribute_id(value: str | None) -> str | None:
    return ATTRIBUTES[value]["id"] if value in ATTRIBUTES else None


def to_number(value: float) -> int | float:
    return int(value) if float(value).is_integer() else value


character_id_by_image = {}


def character_image_key(path: str) -> str:
    stem = Path(path).stem
    variant = next((v for k, v in IMAGE_VARIANTS.items() if stem.endswith(k)), "main")
    return f"characters/{character_id_by_image[Path(path).parent.as_posix()]}/{variant}"


def load(name: str):
    return json.loads((DATA_DIR / f"{name}.json").read_text(encoding="utf-8"))


def write(name: str, data):
    (MASTER_DIR / f"{name}.json").write_text(
        json.dumps(data, ensure_ascii=False, indent=JSON_INDENT) + "\n", encoding="utf-8"
    )


def main():
    MASTER_DIR.mkdir(parents=True, exist_ok=True)
    legacy_characters = sorted(load("characters"), key=lambda c: c["monsterNo"])
    legacy_quests = load("quests")
    legacy_weathers = load("weathers")
    legacy_items = load("items")
    databases = load("databases")

    for c in legacy_characters:
        character_id_by_image[Path(c["mainImage"]).parent.as_posix()] = to_id(c["m_Name"])

    attributes = [
        {**a, "iconKey": f"attributes/{a['id']}", "bgmKey": f"bgm/battle/{a['id']}"} for a in ATTRIBUTES.values()
    ]

    characters = [
        {
            "id": to_id(c["m_Name"]),
            "no": c["monsterNo"],
            "name": c["CharacterLavelName"].strip("「」"),
            "category": CHARACTER_CATEGORIES[c["_category"]],
            "attribute": attribute_id(c["Attribute"]),
            "description": c["Information"].strip(),
            "base": {
                "hp": to_number(c["PvpHP"]),
                "attack": to_number(c["PvpAttckPower"]),
                "defence": to_number(c["PvpDefencePower"]),
                "attackBuffRate": to_number(c["PvpAttackBuffRate"]),
                "defenceBuffAmount": to_number(c["PvpDeffenceBuffAmount"]),
                "checkMax": c["PvpCheckMaxCount"],
                "rewindMax": c["PvpReturnMaxCount"],
                "specialMax": c["PvpSpecialMaxCount"],
                "numbnessResistant": c["IsNumbnessResistance"],
            },
            "duplicateBonusMax": {
                "hp": c["MaxHpCharaBuffCount"],
                "attack": c["MaxAtkCharaBuffCount"],
                "defence": c["MaxDefCharaBuffCount"],
            },
            "assets": {
                "main": character_image_key(c["mainImage"]),
                "icon": character_image_key(c["icon"]),
                "home": character_image_key(c["homeImage"]),
            },
        }
        for c in legacy_characters
    ]
    character_ids = {c["id"] for c in characters}

    weather_by_server_name = {w["serverWeatherName"]: w for w in legacy_weathers}
    quest_by_name = {q["m_Name"]: q for q in legacy_quests}

    def enemy_stage(q):
        return {
            "name": q["labelEnemyName"],
            "imageKey": character_image_key(q["mainImage"]),
            "battle": {
                "hp": to_number(q["QuestHP"]),
                "attack": to_number(q["QuestAttckPower"]),
                "defence": to_number(q["QuestDefencePower"]),
                "attribute": attribute_id(q["Attribute"]),
                "attackBuffRate": to_number(q["QuestAttackBuffRate"]),
                "defenceBuffAmount": to_number(q["QuestDeffenceBuffAmount"]),
                "fixedAttackPower": to_number(q["QuestFixedAttackPower"]),
                "strongAttackPower": to_number(q["QuestStrongAttackPower"]),
                "recoveryRate": to_number(q["QuestRecoveryRate"]),
                "changeAttribute": attribute_id(q["QuestChangeAttribute"]),
                "attackDebuff": to_number(q["QuestAttackDebuffCount"]),
                "defenceDebuff": to_number(q["QuestDefenceDebuffCount"]),
                "turns": [ENEMY_ACTIONS[t] for t in q["enemyTurns"]],
            },
            "revealCount": q["DisclosureEnemyTurnCount"],
        }

    def stages(q):
        next_name = q["ChangeQuestName"]
        rest = stages(quest_by_name[next_name]) if next_name and next_name != "null" else []
        return [enemy_stage(q), *rest]

    chained = {q["ChangeQuestName"] for q in legacy_quests if q["ChangeQuestName"] not in (None, "null")}

    def db_order(key):
        entries = next(v for k, v in databases[key].items() if isinstance(v, list))
        return [Path(e).stem for e in entries]

    main_order = [n for n in db_order("MainQuestDataBase") if n not in chained]
    event_order = db_order("IventQuestDataBase")
    weather_order = db_order("WeatherQuestDataBase")

    def recruit_target(q):
        last_stage_name = stages(q)[-1]["name"]
        candidate = to_id(last_stage_name)
        return candidate if candidate in character_ids else None

    def quest(q, kind, order):
        weather = weather_by_server_name.get(q["m_Name"]) if kind == "weather" else None
        quest_key = WEATHER_IDS[weather["weatherName"]] if weather else to_id(q["m_Name"])
        quest_id = f"{kind}-{quest_key}"
        base = {
            "id": quest_id,
            "kind": kind,
            "name": weather["weatherName"] if weather else q["m_Name"],
            "order": order,
            "stages": stages(q),
        }
        if q.get("IventQuestLoadImage"):
            base["bannerKey"] = f"quests/{quest_id}/banner"
        if kind == "event":
            base["bgmKey"] = f"bgm/quests/{quest_id}"
        if weather:
            base["weatherId"] = WEATHER_IDS[weather["weatherName"]]
            base["rewards"] = {"recruit": None, "weatherItems": True}
            return base
        base["rewards"] = {"recruit": recruit_target(q), "weatherItems": False}
        return base

    quests = [
        *(quest(quest_by_name[n], "main", i + 1) for i, n in enumerate(main_order)),
        *(quest(quest_by_name[n], "event", i + 1) for i, n in enumerate(event_order)),
        *(quest(quest_by_name[n], "weather", i + 1) for i, n in enumerate(weather_order)),
    ]

    weathers = [
        {
            "id": WEATHER_IDS[w["weatherName"]],
            "name": w["weatherName"],
            "attribute": attribute_id(w["weatherAttribute"]),
            "weight": w["weatherLotteryRate"],
            "bonus": {
                "hp": w["weatherHpBuffAmount"],
                "attack": w["weatherAtkBuffAmount"],
                "defence": w["weatherDefBuffAmount"],
            },
            "questId": f"weather-{WEATHER_IDS[w['weatherName']]}",
        }
        for w in sorted(legacy_weathers, key=lambda w: weather_order.index(w["serverWeatherName"]))
    ]

    items = []
    for i in legacy_items:
        stat = i["itemName"].split("の")[0]
        if stat not in STATS:
            continue
        attribute = attribute_id(i["serverItemName"][: -len(stat)].upper())
        item_id = f"{attribute}-{STATS[stat]}"
        items.append({
            "id": item_id,
            "name": i["itemName"],
            "attribute": attribute,
            "stat": STATS[stat],
            "iconKey": f"items/{item_id}",
        })
    items.sort(key=lambda x: (list(ATTRIBUTES).index(x["attribute"].upper()), list(STATS.values()).index(x["stat"])))

    settings = {
        "minAppVersion": MIN_APP_VERSION,
        "growth": {
            "itemUseMax": ITEM_USE_MAX,
            "itemBonusPerUse": ITEM_BONUS_PER_USE,
            "duplicateBonusPerCount": DUPLICATE_BONUS_PER_COUNT,
        },
        "rewards": {
            "firstClearRecruitRate": FIRST_CLEAR_RECRUIT_RATE,
            "repeatRecruitRate": REPEAT_RECRUIT_RATE,
            "weatherItemDropMin": WEATHER_ITEM_DROP_MIN,
            "weatherItemDropMax": WEATHER_ITEM_DROP_MAX,
            "fudaPerEvenLevel": FUDA_PER_EVEN_LEVEL,
        },
    }

    write("attributes", attributes)
    write("characters", characters)
    write("quests", quests)
    write("weathers", weathers)
    write("items", items)
    write("settings", settings)
    print(f"attributes: {len(attributes)} characters: {len(characters)} quests: {len(quests)} "
          f"weathers: {len(weathers)} items: {len(items)}")


if __name__ == "__main__":
    main()
