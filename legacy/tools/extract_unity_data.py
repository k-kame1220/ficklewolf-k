#!/usr/bin/env python3
import json
import re
import struct
import sys
from pathlib import Path

import yaml

LEGACY_DIR = Path(__file__).resolve().parent.parent
DEFAULT_ASSETS = LEGACY_DIR / "unity" / "Assets"
DEFAULT_OUT = LEGACY_DIR / "data"

META_HEAD_BYTES = 300
MAX_TURNS = 100
FLOAT_DIGITS = 6
ACTK_BOOL_KEY_MAX = 255
ACTK_BOOL_TRUE = 213
ACTK_BOOL_FALSE = 181
INT32_BITS = 32
UINT32_MASK = (1 << INT32_BITS) - 1
INT32_SIGN = 1 << (INT32_BITS - 1)
UTF16_BYTES = 2
JSON_INDENT = 2
UI_TEXTS_INDENT = 1
ASSETS_ARG = 1
OUT_ARG = 2

ATTRIBUTES = ["Null", "YANG", "NOTE", "MOON"]
ENEMY_ACTIONS = ["Null", "攻撃", "防御", "攻撃バフ", "防御バフ", "固定攻撃", "強攻撃", "集中", "必殺技",
                 "挑発", "全回復", "超回復", "属性変化", "ビリビリ", "攻撃デバフ", "防御デバフ"]
PVP_GIMMICKS = ["Null", "属性変化", "全回復", "超回復", "強攻撃", "固定攻撃", "集中", "挑発", "ビリビリ",
                "攻撃デバフ", "防御デバフ"]

SECRET_KEYS = {"clientId", "clientSecret", "accountEncryptionKeyId"}

SKIP = {"m_ObjectHideFlags", "m_CorrespondingSourceObject", "m_PrefabInstance", "m_PrefabAsset",
        "m_GameObject", "m_Enabled", "m_EditorHideFlags", "m_Script", "m_EditorClassIdentifier"}


class UnityLoader(yaml.SafeLoader):
    pass


def _unity_tag(loader, suffix, node):
    return loader.construct_mapping(node, deep=True)


UnityLoader.add_multi_constructor("tag:unity3d.com,2011:", _unity_tag)


def load_asset(path: Path) -> dict:
    text = path.read_text(encoding="utf-8")
    text = re.sub(r"^--- !u!(\d+) &(\d+).*$", "---", text, flags=re.M)
    text = re.sub(r"^(\s*(?:hiddenChars|cryptoKey): )([0-9a-f]+)\s*$", r"\1'\2'", text, flags=re.M)
    docs = [d for d in yaml.load_all(text, Loader=UnityLoader) if d]
    return docs[0]["MonoBehaviour"]


def to_i32(v: int) -> int:
    v &= UINT32_MASK
    return v - (1 << INT32_BITS) if v >= INT32_SIGN else v


def decode(v):
    if not isinstance(v, dict):
        return v
    if "hiddenChars" in v:
        hidden = v.get("hiddenChars") or ""
        key = v.get("cryptoKey") or ""
        if not hidden:
            return v.get("fakeValue") or ""
        hb, kb = bytes.fromhex(hidden), bytes.fromhex(key)
        hc = struct.unpack(f"<{len(hb) // UTF16_BYTES}H", hb)
        kc = struct.unpack(f"<{len(kb) // UTF16_BYTES}H", kb)
        return "".join(chr(c ^ kc[i % len(kc)]) for i, c in enumerate(hc))
    if "hiddenValueOldByte4" in v:
        b = bytearray(struct.pack("<i", to_i32(int(v["hiddenValue"]))))
        b[1], b[2] = b[2], b[1]
        i = struct.unpack("<i", bytes(b))[0] ^ to_i32(int(v["currentCryptoKey"]))
        return round(struct.unpack("<f", struct.pack("<i", to_i32(i)))[0], FLOAT_DIGITS)
    if "hiddenValue" in v and "currentCryptoKey" in v:
        h, k = int(v["hiddenValue"]), int(v["currentCryptoKey"])
        if k <= ACTK_BOOL_KEY_MAX and h ^ k in (ACTK_BOOL_TRUE, ACTK_BOOL_FALSE):
            return (h ^ k) == ACTK_BOOL_TRUE
        return to_i32(h ^ k)
    if "fileID" in v:
        return v
    return {k: decode(x) for k, x in v.items()}


def build_guid_map(assets_root: Path) -> dict:
    m = {}
    for meta in assets_root.rglob("*.meta"):
        try:
            head = meta.read_text(encoding="utf-8", errors="ignore")[:META_HEAD_BYTES]
        except OSError:
            continue
        g = re.search(r"^guid: ([0-9a-f]{32})", head, re.M)
        if g:
            m[g.group(1)] = str(meta.relative_to(assets_root))[: -len(".meta")]
    return m


def resolve_refs(obj, guid_map):
    if isinstance(obj, dict):
        if set(obj) >= {"fileID"} and ("guid" in obj or obj.get("fileID") == 0):
            return guid_map.get(obj.get("guid"), None) if obj.get("guid") else None
        return {k: resolve_refs(v, guid_map) for k, v in obj.items()}
    if isinstance(obj, list):
        return [resolve_refs(v, guid_map) for v in obj]
    return obj


def enum(names, v):
    return names[v] if isinstance(v, int) and 0 <= v < len(names) else v


def extract(path: Path, guid_map: dict) -> dict:
    raw = load_asset(path)
    out = {"_file": path.name}
    for k, v in raw.items():
        if k in SKIP:
            continue
        v = decode(v) if not isinstance(v, list) else [decode(x) for x in v]
        out[k] = resolve_refs(v, guid_map)
    for k in list(out):
        if k in ("Attribute", "PvpChangeAttribute", "QuestChangeAttribute", "weatherAttribute"):
            out[k] = enum(ATTRIBUTES, out[k])
        elif re.fullmatch(r"PvpGimmick\d", k):
            out[k] = enum(PVP_GIMMICKS, out[k])
    turns = [enum(ENEMY_ACTIONS, out.pop(f"TurnJP{i}")) for i in range(1, MAX_TURNS + 1) if f"TurnJP{i}" in out]
    if turns:
        while turns and turns[-1] == "Null":
            turns.pop()
        out["enemyTurns"] = turns
    return out


def extract_ui_texts(scene_dir: Path) -> dict:
    res = {}
    for f in sorted(scene_dir.glob("*.unity")):
        t = f.read_text(encoding="utf-8")
        texts = []
        for m in re.finditer(r'm_Text: ("(?:[^"\\]|\\.|\n)*?"|[^\n]*)\n', t):
            v = m.group(1)
            if v.startswith('"'):
                v = re.sub(r"\n\s*", " ", v)
                try:
                    v = json.loads(v)
                except ValueError:
                    v = v.strip('"')
            v = v.strip()
            if v and v not in texts:
                texts.append(v)
        res[f.name] = texts
    return res


def write_json(path: Path, data, indent=JSON_INDENT):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=indent), encoding="utf-8")


def main():
    assets = Path(sys.argv[ASSETS_ARG]) if len(sys.argv) > ASSETS_ARG else DEFAULT_ASSETS
    out_dir = Path(sys.argv[OUT_ARG]) if len(sys.argv) > OUT_ARG else DEFAULT_OUT
    out_dir.mkdir(parents=True, exist_ok=True)
    guid_map = build_guid_map(assets)
    db = assets / "データベース"
    groups = {
        "characters": db / "キャラクター",
        "quests": db / "クエスト",
        "weathers": db / "お天気",
        "items": db / "アイテム",
    }
    for name, d in groups.items():
        rows = []
        for p in sorted(d.rglob("*.asset")):
            row = extract(p, guid_map)
            row["_category"] = str(p.parent.relative_to(d)) if p.parent != d else ""
            rows.append(row)
        write_json(out_dir / f"{name}.json", rows)
        print(f"{name}: {len(rows)}")

    extras = list(db.glob("*.asset")) + list((assets / "承認とアプリバージョン").glob("*.asset"))
    misc = {p.stem: extract(p, guid_map) for p in sorted(extras)}
    for row in misc.values():
        for k in list(row):
            if k in SECRET_KEYS:
                row[k] = "<REDACTED>"
    write_json(out_dir / "databases.json", misc)
    print(f"databases: {len(misc)}")

    ui_texts = extract_ui_texts(assets / "シーン")
    write_json(out_dir / "ui_texts.json", ui_texts, indent=UI_TEXTS_INDENT)
    print(f"ui_texts: {len(ui_texts)} scenes")


if __name__ == "__main__":
    main()
