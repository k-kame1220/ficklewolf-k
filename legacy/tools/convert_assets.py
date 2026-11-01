#!/usr/bin/env python3
"""旧作の素材を web 用に変換する（docs/02 §10）。

- 同梱素材: web/src/shared/assets/bundled/ に WebP で出力する（git にコミットする）
- 取得素材（キャラの絵・属性とアイテムのアイコン）: web/public/assets/ にハッシュ付きの名前の WebP で出力する（git の外。手でアップロードする）
  属性とアイテムのキーは spec/master の attributes.json・items.json の iconKey
  キー → ファイル名の一覧は web/src/shared/assets/remoteAssets.json（git にコミットする）
- フォント: --font で渡した OTF を web/src/shared/assets/fonts/ に WOFF2 で出力する

使い方:
    legacy/tools/.venv/bin/python legacy/tools/convert_assets.py [--assets <素材の書き出し先>] [--font <mushin.otf>]
"""
import argparse
import hashlib
import io
import json
import re
from pathlib import Path

from fontTools.ttLib import TTFont
from PIL import Image

LEGACY_DIR = Path(__file__).resolve().parent.parent
REPO_DIR = LEGACY_DIR.parent
DATA_DIR = LEGACY_DIR / "data"
MASTER_DIR = REPO_DIR / "spec" / "master"
WEB_ASSETS_DIR = REPO_DIR / "web" / "src" / "shared" / "assets"
BUNDLED_DIR = WEB_ASSETS_DIR / "bundled"
FONT_DIR = WEB_ASSETS_DIR / "fonts"
REMOTE_DIR = REPO_DIR / "web" / "public" / "assets"
REMOTE_MANIFEST = WEB_ASSETS_DIR / "remoteAssets.json"
DEFAULT_ASSETS = LEGACY_DIR / "assets"

WEBP_QUALITY = 82
WEBP_METHOD = 6
HASH_LENGTH = 8
JSON_INDENT = 2
CHARACTER_MAX_WIDTH = 640
ICON_MAX_WIDTH = 256

# 同梱素材: 出力名 → (Unity の Assets からのパス, 最大の幅)
BUNDLED = {
    "paper": ("素材/UI素材/背景画像2.jpg", 1024),
    "noise": ("素材/UI素材/back1.jpg", 1024),
    "frame-bold": ("素材/UI素材/枠.png", 492),
    "frame-paper": ("素材/UI素材/枠2.png", 424),
    "frame-pencil": ("素材/UI素材/メニューボタン枠.png", 408),
    "frame-square": ("素材/UI素材/アイコン枠.png", 256),
    "pencil-fill": ("素材/UI素材/メニューパネル.png", 512),
    "logo-k": ("素材/UI素材/K.png", 688),
    "title-emblem": ("素材/OP & Tittle素材/タイトル素材/タイトルｋkk.png", 1024),
    "title-background": ("素材/OP & Tittle素材/タイトル素材/kタイトル.png", 348),
}
IMAGE_VARIANTS = {"(アイコン)": "icon", "(ホーム)": "home"}
# 属性の ID → 旧作のファイル名（属性画像 は日本語、強化素材 は英語の頭）
ATTRIBUTE_FILES = {"yang": ("陽", "Yang"), "note": ("音", "Note"), "moon": ("月", "Moon")}
STAT_FILES = {"hp": "HP", "attack": "ATK", "defence": "DEF"}


def to_id(name: str) -> str:
    return re.sub(r"[^a-z0-9-]", "-", name.lower())


def to_webp(source: Path, max_width: int) -> bytes:
    image = Image.open(source)
    image = image.convert("RGBA" if image.mode in ("RGBA", "LA", "P") else "RGB")
    if image.width > max_width:
        height = round(image.height * max_width / image.width)
        image = image.resize((max_width, height), Image.Resampling.LANCZOS)
    buffer = io.BytesIO()
    image.save(buffer, "WEBP", quality=WEBP_QUALITY, method=WEBP_METHOD)
    return buffer.getvalue()


def convert_bundled(assets: Path):
    BUNDLED_DIR.mkdir(parents=True, exist_ok=True)
    for name, (path, max_width) in BUNDLED.items():
        (BUNDLED_DIR / f"{name}.webp").write_bytes(to_webp(assets / path, max_width))
        print(f"bundled: {name}.webp")


def character_sources():
    characters = json.loads((DATA_DIR / "characters.json").read_text(encoding="utf-8"))
    for c in characters:
        character_id = to_id(c["m_Name"])
        for path in (c["mainImage"], c["icon"], c["homeImage"]):
            stem = Path(path).stem
            variant = next((v for k, v in IMAGE_VARIANTS.items() if stem.endswith(k)), "main")
            yield f"characters/{character_id}/{variant}", path


def icon_sources():
    attributes = json.loads((MASTER_DIR / "attributes.json").read_text(encoding="utf-8"))
    for a in attributes:
        yield a["iconKey"], f"素材/属性画像/{ATTRIBUTE_FILES[a['id']][0]}.png"
    items = json.loads((MASTER_DIR / "items.json").read_text(encoding="utf-8"))
    for i in items:
        yield i["iconKey"], f"素材/アイテム素材/強化素材/{ATTRIBUTE_FILES[i['attribute']][1]}{STAT_FILES[i['stat']]}.png"


def convert_remote(assets: Path):
    manifest = {}
    sources = [(key, path, CHARACTER_MAX_WIDTH) for key, path in character_sources()] + [
        (key, path, ICON_MAX_WIDTH) for key, path in icon_sources()
    ]
    for key, path, max_width in sources:
        data = to_webp(assets / path, max_width)
        file_name = f"{key}.{hashlib.sha256(data).hexdigest()[:HASH_LENGTH]}.webp"
        (REMOTE_DIR / file_name).parent.mkdir(parents=True, exist_ok=True)
        (REMOTE_DIR / file_name).write_bytes(data)
        manifest[key] = file_name
    REMOTE_MANIFEST.write_text(
        json.dumps(dict(sorted(manifest.items())), ensure_ascii=False, indent=JSON_INDENT) + "\n", encoding="utf-8"
    )
    print(f"remote: {len(manifest)} files")


def convert_font(font: Path):
    FONT_DIR.mkdir(parents=True, exist_ok=True)
    otf = TTFont(font)
    otf.flavor = "woff2"
    otf.save(FONT_DIR / "mushin.woff2")
    print("font: mushin.woff2")


def main():
    parser = argparse.ArgumentParser(description="旧作の素材を web 用に変換する")
    parser.add_argument("--assets", type=Path, default=DEFAULT_ASSETS, help="素材の書き出し先（中に 素材/ がある。既定は legacy/assets）")
    parser.add_argument("--font", type=Path, help="無心（MODI工場）の mushin.otf。渡したときだけ変換する")
    args = parser.parse_args()

    convert_bundled(args.assets)
    convert_remote(args.assets)
    if args.font is not None:
        convert_font(args.font)


if __name__ == "__main__":
    main()
