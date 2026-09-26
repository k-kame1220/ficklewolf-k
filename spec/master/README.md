# マスタデータ

リメイクで使うマスタデータの**正**。api がデプロイ時に DB へ投入して配信する（`docs/02` §10）。

| ファイル | 内容 | 件数 |
|---|---|---|
| `attributes.json` | 属性（陽・音・月）と相性・属性ごとの BGM | 3 |
| `characters.json` | キャラの基礎ステータス・被りの上限・画像 | 38 |
| `quests.json` | クエスト（メイン・イベント・お天気）と敵・報酬 | 42 |
| `weathers.json` | 天気（抽選の重み・同じ属性のキャラへのボーナス） | 12 |
| `items.json` | 強化アイテム（属性 × HP / 攻撃 / 防御） | 9 |
| `settings.json` | 最初のキャラ・成長の係数・報酬の値・必要なアプリの最低バージョン | — |
| `schema/*.schema.json` | 各ファイルの JSON Schema | — |

## ルール
- ID は小文字の英数字とハイフン（例: `a`, `per-o`, `main-a`, `weather-blue-sky`）。表示名は `name`。
- 素材はパスではなくキーで書く（例: `characters/a/main`）。置き場所は配信側の設定で決まる。
- クエストの敵のバトル用の値（`stages[].battle`）は、ゴールデンテストの `enemy` と同じ形（`spec/battle/case.schema.json` を参照）。
- 連戦のクエスト（`main-i`）は `stages` が 2 つ。
- 変更したら `python3 spec/tools/validate.py` を通す（CI でも実行する）。

## バージョン
マスタのバージョンは中身から計算する。`attributes, characters, items, quests, settings, weathers` の順に「`ファイル名.json` と改行」「ファイルのバイト列そのもの」を SHA-256 に入れ、16 進の先頭 16 文字をバージョンにする（`spec/tools/validate.py` の `master_version`）。

## フェーズ 1 に入れていないもの
- PvP（15thクノット）だけで使う項目: スピード・スピードバフ・ギミック（フェーズ 2 で足す）。
- そのため、スピードのアイテム 3 種と、天気のスピードのボーナス（メキシコ・縮地・雷）は入れていない。

## 作り方
`legacy/data` から `legacy/tools/build_master.py` で 1 回だけ作った。**これ以降はこのディレクトリの JSON を直接編集する**（スクリプトは再実行しない）。
