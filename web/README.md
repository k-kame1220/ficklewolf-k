# web/ — K フロントエンド

React + TypeScript（Vite）。設計は `../docs/03_frontend-architecture.md`、実装のルールは `CLAUDE.md`。

## 準備（clone したら 1 回だけ）

```bash
cd web && pnpm install
```

### 取得素材（キャラの絵など）を作る
キャラの絵などの取得素材は `web/public/assets/` に置く。**このフォルダは git の対象外**（容量が大きく、本番では別の配信先から配るため。`docs/03` §5.4）なので、clone しただけでは空になっている。空のままだと、画像の URL に画像ではなくアプリの HTML が返り、キャラの絵が出ない。

旧作の素材から変換して作る（ツールの準備は `../legacy/README.md`）:

```bash
legacy/tools/.venv/bin/python legacy/tools/convert_assets.py
```

- リポジトリのルートで実行する。出力先は `web/public/assets/`。ファイル名は変換後の中身のハッシュ付き。
- 同梱素材（`src/shared/assets/bundled/`）と `src/shared/assets/remoteAssets.json`（どちらもコミット済み）も書き直す。素材を作るだけのときは、実行後に `git status` で差分が出ていないことを確かめる（差分が出たら、Pillow の版などで変換結果が変わっている）。
- worktree（`K-ai/` など）には `legacy/unity` がないので、`--assets ~/develop/ficklewolf/K/legacy/unity/Assets` で元のチェックアウトを指す。
- 別の作業フォルダに変換済みのものがあれば、`web/public/assets/` ごとコピーしてもよい。
- 開発サーバーは起動したときの `public/` の中身を覚えている。素材を置いたら `pnpm dev` を起動し直す。

## 開発サーバー

```bash
cd web && pnpm dev
```

- http://localhost:4100 。既定では MSW のモックの api を使う（api を起動しなくても動く。データはメモリにあり、再読み込みで消える）。
- 本物の api（http://localhost:8080 。`cd api && ./gradlew bootRun`）につなぐときは `VITE_API_MOCK=false pnpm dev`。

| 環境変数 | 既定 | 意味 |
|---|---|---|
| `VITE_API_MOCK` | `true` | `false` で本物の api につなぐ（本番のビルドでは常にモックを使わない） |
| `VITE_API_BASE_URL` | `http://localhost:8080` | api の基点 URL |
| `VITE_ASSET_BASE_URL` | `/assets` | 取得素材の基点 URL（末尾の `/` なし） |

## よく使うコマンド

| コマンド | 内容 |
|---|---|
| `pnpm check` | 型チェック・lint・テスト・ビルドをまとめて実行（完了の条件） |
| `pnpm e2e` | Playwright。開発サーバーを使い、`screenshots/` に画面を撮る（初回は `pnpm exec playwright install chromium`。ほかの開発サーバーと重なるときは `E2E_PORT=4102 pnpm e2e`） |
| `pnpm api:generate` | `../spec/openapi/openapi.yaml` から `src/api/generated/schema.ts` を作り直す |
