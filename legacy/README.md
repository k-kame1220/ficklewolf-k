# legacy/

旧 Unity 版 K の本体と、そこから抽出した資料。リメイクでは `data/` を参照し、`unity/` 本体は直接参照しない。

```
legacy/
├── unity/          旧 Unity プロジェクト（.gitignore 済み。署名鍵・GS2 認証情報を含む）
├── data/           抽出したマスタデータ（JSON）
├── screenshots/    旧作の実機のスクリーンショット（中身は .gitignore 済み。手元にだけある）
└── tools/          移行用のスクリプト（Python）
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
| `tools/extract_unity_data.py` | 上の JSON を作るスクリプト（ACTk の Obscured 型を復号。PyYAML が必要） |

再生成:
```bash
python3 legacy/tools/extract_unity_data.py
```
（引数を省略すると `legacy/unity/Assets` → `legacy/data` に書き出す）

画像・音声のパス（`mainImage` など）は `unity/Assets/` からの相対パス。

`screenshots/` は旧作を実機で動かして撮った画面（ホーム・クエスト・戦闘・ガチャ・チュートリアルなど）。画面を作り直すときの見た目と流れの参考にする。画像は重く、公開リポジトリには置かないので、コミットするのは `.gitignore` だけ。
