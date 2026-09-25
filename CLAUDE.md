# K（リメイク）

旧作（2021 年・Unity）の 1 対 1 ターン制コマンドバトル RPG「K」を、Web / iOS / Android 向けに作り直すモノリポ。作者は FickleWolf。

## 役割分担
| 場所 | 担当 | AI がしてよいこと |
|---|---|---|
| `web/` | AI | 実装・テスト・リファクタ |
| `api/` | オーナー | **読むだけ**（レビュー・解説・相談）。編集はしない |
| `spec/` | 両方の約束事 | 下書きの提案まで。**確定はオーナー**。テストを通すために spec を書き換えない |
| `docs/` | 両方 | 決定事項の記録。オーナーの判断が必要な内容は相談してから書く |
| `legacy/` | — | `data/` を参照するだけ。`unity/` は読まない（署名鍵・認証情報を含む） |

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
- `spec/`: 機械で確かめられる仕様（OpenAPI・バトルのゴールデンテスト・マスタデータ）。これが正。
- `docs/`: なぜそうするか・どう感じてほしいか。

## ドキュメント
| ファイル | 内容 |
|---|---|
| `docs/00_project-context.md` | 目的・決定事項・構成 |
| `docs/01_legacy-analysis.md` | 旧作のルールと数値（ソースから逆算） |
| `docs/02_requirements.md` | 要件定義（フェーズ・画面・API） |
| `docs/03_frontend-architecture.md` | フロントの設計とコーディングルール |
| `docs/04_git-workflow.md` | Git 運用ルール |
| `web/CLAUDE.md` | フロント実装時に守ること |

## コマンド
```bash
cd web && pnpm check
cd web && pnpm dev
```
