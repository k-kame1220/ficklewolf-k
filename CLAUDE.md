# K（リメイク）

旧作（2021 年・Unity）の 1 対 1 ターン制コマンドバトル RPG「K」を、Web / iOS / Android 向けに作り直すモノリポ。作者は FickleWolf（Shackw の子ブランド）。
GitHub: https://github.com/k-kame1220/ficklewolf-k （公開・既定のブランチは `develop`）

## 役割分担
| 場所 | 担当 | AI がしてよいこと |
|---|---|---|
| `web/` | AI | 実装・テスト・リファクタ |
| `api/` | オーナー | **読むだけ**（レビュー・解説・相談）。編集はしない |
| `spec/` | 両方の約束事 | 下書きの提案まで。**確定はオーナー**。テストを通すために spec を書き換えない |
| `docs/` | 両方 | 決定事項の記録。オーナーの判断が必要な内容は相談してから書く |
| `legacy/` | — | `data/` を参照する。`unity/` は素材（`Assets/素材`）の読み込みだけ可（素材の変換用）。それ以外は署名鍵・認証情報を含むので読まない（`.claude/settings.json` で禁止） |

## 作業場所とブランチ
- AI は worktree `~/develop/ficklewolf/K-ai` で作業する。オーナーの `K/` のブランチは切り替えない。
- 作業ブランチは `develop` から切る: `feature/` `fix/` `chore/` `refact/`（小文字・数字・`.` `_` `-`）。
- `main` / `staging` / `develop` には直接コミットしない。マージはオーナーが行う。
- コミット前に pre-commit フックが format・lint・test・build を確認する。作業ブランチには AI が自由にコミットしてよい。
- タスクは GitHub Issues。新しい画面や設計に影響する作業は、実装前に計画を出して承認をもらう。
- 完了条件: `pnpm check` とゴールデンテストが全部通ること。画面を変えたらスクリーンショットを PR に貼る。
- ライブラリの追加は事前にオーナーに聞く（`docs/03` で予定済みのものを除く）。
- 設計・仕様に関わる判断は同じ PR で `docs/` を更新する。文章は日本語、コード上の名前は英語。
- コミットメッセージは Conventional Commits（`feat(web): ...`）。

## 仕様の置き場所
- `spec/`: 機械で確かめられる仕様。これが正。
  - `spec/battle/`: バトルの計算ルール（README）とゴールデンテスト
  - `spec/master/`: マスタデータ（キャラ・クエスト・天気・アイテム・設定）
  - `spec/tools/validate.py`: spec の検証（pre-commit・CI でも実行）
  - `spec/openapi/openapi.yaml`: API の定義（実装を始める API から順に書き足す）
- `docs/`: なぜそうするか・どう感じてほしいか。

## ドキュメント
| ファイル | 内容 |
|---|---|
| `docs/00_project-context.md` | 目的・決定事項・構成 |
| `docs/01_legacy-analysis.md` | 旧作のルールと数値（ソースから逆算した記録。リメイクの正は spec） |
| `docs/02_requirements.md` | 要件定義（フェーズ・機能・画面・API・マスタと素材の配信・決定事項） |
| `docs/03_frontend-architecture.md` | フロントの設計とコーディングルール |
| `docs/04_git-workflow.md` | Git 運用・AI との作業の進め方・CI |
| `spec/battle/README.md` | バトルの計算ルール（正） |
| `spec/master/README.md` | マスタデータのルール |
| `web/CLAUDE.md` | フロント実装時に守ること |

## コマンド
```bash
cd web && pnpm check
cd web && pnpm dev
python3 spec/tools/validate.py
```
