# legacy/

旧 Unity 版 K の本体と、そこから抽出した資料。リメイクでは `data/` を参照し、`unity/` 本体は直接参照しない。

```
legacy/
├── unity/          旧 Unity プロジェクト（.gitignore 済み。署名鍵・GS2 認証情報を含む）
├── data/           抽出したマスタデータ（JSON）
├── screenshots/    旧作の実機のスクリーンショット（中身は .gitignore 済み。手元にだけある）
└── tools/          移行用のスクリプト（Python。依存は tools/requirements.txt）
```

| パス | 内容 |
|---|---|
| `data/characters.json` | キャラ 38 体のステータス・ギミック・画像パス |
| `data/quests.json` | クエスト 43 件の敵ステータスと行動パターン（`enemyTurns`） |
| `data/weathers.json` | 天気 12 種（属性・抽選の重み・ボーナス） |
| `data/items.json` | 強化アイテム 12 種 |
| `data/databases.json` | 各 DB の並び順・SE 一覧・バージョン（認証情報は `<REDACTED>`） |
| `data/ui_texts.json` | シーンごとの UI 文言（ヘルプ・チュートリアル文を含む） |
| `tools/build_master.py` | `data/` から `spec/master` の初版を作ったスクリプト（1 回だけ使用。以後は `spec/master` を直接編集） |
| `tools/convert_assets.py` | `unity/Assets/素材` を web 用に変換する（画像 → WebP、無心フォント → WOFF2。`docs/02` §10） |
| `tools/extract_unity_data.py` | 上の JSON を作るスクリプト（ACTk の Obscured 型を復号。PyYAML が必要） |

ツールの準備（初回だけ。`tools/.venv` は git の対象外）:
```bash
python3 -m venv legacy/tools/.venv && legacy/tools/.venv/bin/pip install -r legacy/tools/requirements.txt
```

再生成:
```bash
legacy/tools/.venv/bin/python legacy/tools/extract_unity_data.py
```
（引数を省略すると `legacy/unity/Assets` → `legacy/data` に書き出す）

素材の変換:
```bash
legacy/tools/.venv/bin/python legacy/tools/convert_assets.py --font <mushin.otf>
```
- 同梱素材（紙・ノイズ・枠・ロゴ）→ `web/src/shared/assets/bundled/`、無心 → `web/src/shared/assets/fonts/`（どちらもコミットする）
- 取得素材（キャラの絵）→ `web/public/assets/`（コミットしない。配信先に手でアップロードする）と、キーの一覧 `web/src/shared/assets/remoteAssets.json`（コミットする）
- フォントは MODI工場の「無心」ver1.04（https://modi.jpn.org/font_mushin.php）。`--font` を省くとフォントは変換しない
- `--assets` で Unity の Assets の場所を変えられる（worktree では `legacy/unity` がないので、元のチェックアウトを指す）

画像・音声のパス（`mainImage` など）は `unity/Assets/` からの相対パス。

`screenshots/` は旧作を実機で動かして撮った画面（ホーム・クエスト・戦闘・ガチャ・チュートリアルなど）。画面を作り直すときの見た目と流れの参考にする。画像は重く、公開リポジトリには置かないので、コミットするのは `.gitignore` だけ。
