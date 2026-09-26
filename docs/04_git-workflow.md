# Git 運用ルール

> 版: v0.2（2026-09-26）

## ブランチ

| ブランチ | 役割 | 直接コミット |
|---|---|---|
| `main` | 本番 | 不可 |
| `staging` | 本番前の確認 | 不可 |
| `develop` | 開発の統合 | 不可 |
| `feature/xxx` | 機能追加 | 可 |
| `fix/xxx` | バグ修正 | 可 |
| `chore/xxx` | 設定・依存・ドキュメントなど | 可 |
| `refact/xxx` | リファクタリング | 可 |

- 作業ブランチは `develop` から切り、PR で `develop` にマージする。
- `develop` → `staging` → `main` の順に PR でマージして昇格させる。
- 作業ブランチ名の `xxx` は小文字・数字・`.`・`_`・`-` だけ（例: `feature/battle-rewind`）。

## オーナーと AI の作業フォルダ（git worktree）

同じリポジトリを 2 つの作業フォルダで開き、オーナーと AI が別のブランチで同時に作業する。

```
~/develop/ficklewolf/
├── K/      オーナーの作業フォルダ（api/ など）
└── K-ai/   AI の作業フォルダ（web/ など）
```

- git の履歴は 1 つを共有する。AI のブランチは `K/` 側からもそのまま見え、マージできる。
- 同じブランチは 2 つのフォルダで同時に開けない（git が止める）。AI は `K-ai/` で `develop` から作業ブランチを切る。
- `node_modules` はフォルダごとに必要（`K-ai/web` で `pnpm install`）。pnpm のストアと Gradle のキャッシュは共有される。
- git 管理外のファイル（`api/.env`、`legacy/unity/`）は `K-ai/` には無い。
- AI の作業が終わったら、オーナーがレビューして `develop` にマージする。

```bash
git worktree add ../K-ai -b <作業ブランチ> develop
git worktree list
git worktree remove ../K-ai
```

## AI との作業の進め方

| 項目 | ルール |
|---|---|
| タスク | GitHub Issues で管理する。Issue には目的・対象（画面 S-xx / spec など）・完了条件を書く |
| 計画 | 新しい画面や設計に影響する作業は、実装前に計画を出してオーナーの承認をもらう。小さな修正はそのまま進める |
| コミット | AI は自分の作業ブランチには自由にコミットしてよい（pre-commit が通ること）。`develop` へのマージはオーナーが行う |
| 完了条件 | `pnpm check` とゴールデンテストが全部通ること。画面を変えたら Playwright で撮ったスクリーンショットを PR に貼る |
| 依存の追加 | ライブラリを追加する前に「何を・なぜ」をオーナーに聞く。`docs/03` で予定済みのもの（MSW・openapi-fetch・Howler・Motion・Playwright）は承認済み |
| ドキュメント | 設計や仕様に関わる判断をしたら、同じ PR で `docs/` を更新し、PR に「決めたこと」を書く。オーナーの判断が必要なものは先に相談する |
| 言語 | ドキュメント・コミットメッセージ・PR・Issue は日本語。コード上の名前は英語 |

## コミット前の確認（pre-commit フック）

コミットのたびに `.githooks/pre-commit` が次を確認し、1 つでも失敗したらコミットしない。

1. ブランチ名がルールに合っていること（`main` / `staging` / `develop` への直接コミットは不可）
2. 変更したプロジェクトの format・lint・test・build が通ること

| 変更したファイル | 実行するもの |
|---|---|
| `web/`・`spec/openapi/` | `pnpm check`（生成した API の型の確認 → Prettier の確認 → ESLint → Vitest → 型チェック＋ビルド） |
| `api/` | `./gradlew build`（ktlint → テスト → ビルド） |
| `spec/` | `python3 spec/tools/validate.py`（スキーマ・相互参照） |
| `docs/`・`legacy/` など | なし |

### 初回の設定（clone したら 1 回だけ）

```bash
git config core.hooksPath .githooks
```

## コミットメッセージ

Conventional Commits の形で書く。

```
<type>(<scope>): <内容>
```

- type: `feat` / `fix` / `chore` / `refactor` / `docs` / `test`
- scope: `web` / `api` / `docs` / `legacy` など（任意）
- 例: `feat(web): リターンの演出を追加`、`fix(api): ヘルスチェックのパスを修正`

## GitHub
- リポジトリ: https://github.com/k-kame1220/ficklewolf-k （公開。無料プランの非公開リポジトリではブランチ保護が使えないため）
- 既定のブランチは `develop`。マージはマージコミットのみ。マージしたブランチは自動で削除される。
- **ブランチ保護**（ruleset `protected-branches`）: `develop` / `staging` / `main` は PR 経由でのみ変更でき、CI の `result` が通っていないとマージできない。削除と force push も禁止。
- **CI**（`.github/workflows/ci.yml`）: PR と保護ブランチへの push で実行する。変更があったものだけ確認する。

| ジョブ | 実行する条件 | 内容 |
|---|---|---|
| `web` | `web/`・`spec/`・`.github/` の変更 | `pnpm check` |
| `api` | `api/`・`spec/`・`.github/` の変更 | `./gradlew build` |
| `spec` | `spec/`・`.github/` の変更 | `python3 spec/tools/validate.py` |
| `result` | 常に | 上のどれかが失敗していたら失敗（ブランチ保護の必須チェック） |
