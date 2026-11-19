#!/usr/bin/env python3
"""旧作の素材を web 用に変換する（docs/02 §10）。

- 同梱素材: web/src/shared/assets/bundled/ に WebP で出力する（git にコミットする）
- 取得素材（キャラの絵・属性とアイテムのアイコン）: web/public/assets/ にハッシュ付きの名前の WebP で出力する（git の外。手でアップロードする）
  属性とアイテムのキーは spec/master の attributes.json・items.json の iconKey
  キー → ファイル名の一覧は web/src/shared/assets/remoteAssets.json（git にコミットする）
- 効果音: web/src/shared/assets/sounds/ に mp3 で出力する（git にコミットする）
- 演出のコマ送り（時計・目のカットイン、ビリビリ、バフの矢印）: 1 つのアニメーションを横に並べた 1 枚の WebP にして
  web/src/shared/assets/bundled/ に出力する（git にコミットする）
- 戦闘の BGM: 取得素材として mp3 で出力する。キーは spec/master の attributes.json の bgmKey
- フォント: --font で渡した OTF を web/src/shared/assets/fonts/ に WOFF2 で出力する
- 音の変換には ffmpeg を使う

使い方:
    legacy/tools/.venv/bin/python legacy/tools/convert_assets.py [--assets <素材の書き出し先>] [--font <mushin.otf>]
"""
import argparse
import hashlib
import io
import json
import re
import subprocess
import tempfile
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
SOUND_DIR = WEB_ASSETS_DIR / "sounds"
REMOTE_DIR = REPO_DIR / "web" / "public" / "assets"
REMOTE_MANIFEST = WEB_ASSETS_DIR / "remoteAssets.json"
DEFAULT_ASSETS = LEGACY_DIR / "assets"

WEBP_QUALITY = 82
WEBP_METHOD = 6
HASH_LENGTH = 8
JSON_INDENT = 2
CHARACTER_MAX_WIDTH = 640
ICON_MAX_WIDTH = 256
SE_BITRATE = "128k"
BGM_BITRATE = "160k"

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

# 効果音: 出力名 → 素材/音素材/SE の中のファイル（スピードバフはフェーズ 2）
SOUNDS = {
    "attack": "攻撃.mp3",
    "strong-attack": "強攻撃.mp3",
    "fixed-attack": "固定攻撃.mp3",
    "special": "必殺技.mp3",
    "defend": "防御.mp3",
    "attack-buff": "攻撃バフ.wav",
    "defence-buff": "防御バフ.mp3",
    "debuff": "デバフ.mp3",
    "concentration": "集中.mp3",
    "provocation": "挑発.mp3",
    "full-recovery": "全回復.wav",
    "rate-recovery": "超回復.wav",
    "numbness-enemy": "ビリビリ（敵）.wav",
    "numbness-self": "ビリビリ（自分）.wav",
    "check": "チェック.mp3",
    "rewind": "リターン.wav",
    "change-attribute": "属性変化.ogg",
    "fail": "失敗.mp3",
    "tap": "タップ.mp3",
    "notify": "通知.mp3",
}

# 演出のコマ送り: 出力名 → (コマの並び（素材/ からのパス）, 1 コマの幅, 1 コマの高さ)。
# コマは横に並べて 1 枚にする（WebP の幅の上限 16383px に収まる大きさにする）
SPRITES = {
    "fx-buff-arrow": (["UI素材/バフエフェクト.png"], 256, 256),
    "fx-rewind-clock": ([f"カットイン素材/Return/{i:03d}.png" for i in range(1, 7)], 360, 360),
    "fx-special-eye": ([f"カットイン素材/SP/{i:03d}.jpg" for i in range(1, 41)], 320, 320),
    "fx-numbness-enemy": ([f"演出素材/ビリビリ(敵)/ビリビリ{i}.png" for i in range(1, 9)], 150, 512),
    "fx-numbness-self": ([f"演出素材/ビリビリ(自分)/ビリ{i}.png" for i in range(1, 9)], 360, 246),
}

# 戦闘の BGM: 属性の ID → 素材/キャラクター/戦闘BGM の中のファイル
BATTLE_BGM_FILES = {"yang": "YANG.wav", "note": "NOTE.wav", "moon": "MOON.wav"}
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


def to_mp3(source: Path, bitrate: str) -> bytes:
    with tempfile.TemporaryDirectory() as tmp:
        output = Path(tmp) / "out.mp3"
        subprocess.run(
            ["ffmpeg", "-v", "error", "-y", "-i", str(source), "-map_metadata", "-1", "-fflags", "+bitexact",
             "-flags:a", "+bitexact", "-codec:a", "libmp3lame", "-b:a", bitrate, str(output)],
            check=True,
        )
        return output.read_bytes()


def to_sprite(sources: list[Path], frame_width: int, frame_height: int) -> bytes:
    sheet = Image.new("RGBA", (frame_width * len(sources), frame_height), (0, 0, 0, 0))
    for index, source in enumerate(sources):
        frame = Image.open(source).convert("RGBA").resize((frame_width, frame_height), Image.Resampling.LANCZOS)
        sheet.paste(frame, (frame_width * index, 0))
    buffer = io.BytesIO()
    sheet.save(buffer, "WEBP", quality=WEBP_QUALITY, method=WEBP_METHOD)
    return buffer.getvalue()


def convert_bundled(assets: Path):
    BUNDLED_DIR.mkdir(parents=True, exist_ok=True)
    for name, (path, max_width) in BUNDLED.items():
        (BUNDLED_DIR / f"{name}.webp").write_bytes(to_webp(assets / path, max_width))
        print(f"bundled: {name}.webp")
    for name, (paths, frame_width, frame_height) in SPRITES.items():
        sprite = to_sprite([assets / "素材" / path for path in paths], frame_width, frame_height)
        (BUNDLED_DIR / f"{name}.webp").write_bytes(sprite)
        print(f"bundled: {name}.webp（{len(paths)} コマ）")
    SOUND_DIR.mkdir(parents=True, exist_ok=True)
    for name, file in SOUNDS.items():
        (SOUND_DIR / f"{name}.mp3").write_bytes(to_mp3(assets / "素材" / "音素材" / "SE" / file, SE_BITRATE))
    print(f"sounds: {len(SOUNDS)} files")


def bgm_sources():
    attributes = json.loads((MASTER_DIR / "attributes.json").read_text(encoding="utf-8"))
    for a in attributes:
        yield a["bgmKey"], f"素材/キャラクター/戦闘BGM/{BATTLE_BGM_FILES[a['id']]}"


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
    outputs = [(key, to_webp(assets / path, max_width), "webp") for key, path, max_width in sources] + [
        (key, to_mp3(assets / path, BGM_BITRATE), "mp3") for key, path in bgm_sources()
    ]
    for key, data, extension in outputs:
        file_name = f"{key}.{hashlib.sha256(data).hexdigest()[:HASH_LENGTH]}.{extension}"
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
