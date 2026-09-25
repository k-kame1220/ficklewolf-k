# Git 運用ルール

> 版: v0.1（2026-09-25）

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

## コミット前の確認（pre-commit フック）

コミットのたびに `.githooks/pre-commit` が次を確認し、1 つでも失敗したらコミットしない。

1. ブランチ名がルールに合っていること（`main` / `staging` / `develop` への直接コミットは不可）
2. 変更したプロジェクトの format・lint・test・build が通ること

| 変更したファイル | 実行するもの |
|---|---|
| `web/` | `pnpm check`（Prettier の確認 → ESLint → Vitest → 型チェック＋ビルド） |
| `api/` | `./gradlew build`（ktlint → テスト → ビルド） |
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
