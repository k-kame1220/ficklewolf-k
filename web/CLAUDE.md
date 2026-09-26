# web/ — K フロントエンド（AI が実装する）

設計の全体は `../docs/03_frontend-architecture.md`、要件は `../docs/02_requirements.md`。
バトルのルールの正は `../spec/battle/README.md`、マスタデータの正は `../spec/master/`（旧作の記録は `../docs/01_legacy-analysis.md`）。
**`../api/` はオーナー専用。AI はコードを書かない。**

## API の型
- OpenAPI（`../spec/openapi/openapi.yaml`）を変えたら `pnpm api:generate` で `src/api/generated/schema.ts` を作り直してコミットする。`pnpm check` がずれを検出する。

## 必ず守ること（オーナーの方針・最優先）
1. **上から順に読める実装にする。** 処理は起きる順に上から書く。読む人の目を上下させない。
2. **むやみに関数に切り出さない。** 一度しか使わない処理は、その場に書く。切り出すのは「2 か所以上で使う」「ゲームのルール（domain）」「単体でテストしたい」場合だけ。
3. **分岐して値を決めるときは即時実行関数（IIFE）。** `let` で宣言して後から代入しない。三項演算子の入れ子もしない。
4. **書き換えない。** `let`・`push`・`splice`・プロパティへの代入・`++` は使わない。新しい値を作る。
5. **計算量を意識する。** `some`/`every`/`find`/`includes`/`indexOf` などの線形探索は使わない。`Map`/`Set` を作って `has`/`get` で O(1) で引く。
6. **要らないものは使わない。** sessionStorage・cookie・IndexedDB は使わない。ライブラリを増やすときは理由を PR に書く。
7. **`web/` の中は TS で統一する。** 設定ファイルも `.ts` で書く。旧作からの移行スクリプトは `../legacy/tools/` に Python で置く。
8. **コメントはインターフェースと型定義にだけ書く。** `export` する型・props の型・ストアの型・公開する関数には TSDoc（`/** ... */`）で「何を表すか・何をするか」と名前から分からない約束事（単位・範囲・`null` の意味など）を書く。処理の中には書かない（例外は lint 無効化の理由だけ）。詳細は docs/03 §5.0 の 8。
9. **マジックナンバーは使わない。** 数値は `UPPER_SNAKE_CASE` の定数にする（CSS はトークンの変数）。

## 書き方（オーナーの shackw プロジェクトに合わせる）
```tsx
type EnemyPanelProps = {
  enemy: EnemyView;
};

const EnemyPanel = (props: EnemyPanelProps) => {
  const { enemy } = props;

  const hpLabel = (() => {
    if (enemy.hp <= 0) return "たおれた";
    return `HP ${String(enemy.hp)}`;
  })();

  return (
    <section className={styles.root}>
      <EnemyPanelImage src={enemy.image} />
      <p>{hpLabel}</p>
    </section>
  );
};

export default EnemyPanel;
```
- コンポーネントはアロー関数。props は本体の 1 行目で分割代入。1 ファイル 1 つを default export。
- 1 行の early return は波括弧なし（`if (x) return null;`）。
- 画面はセクション単位の部品を並べるだけ。子部品があるセクションはフォルダにし、`index.tsx` ＋ 親の名前を頭に付けた子部品（`EnemyPanel/EnemyPanelImage.tsx`）。
- 型は `type`。`XxxProps` / `XxxContextType` / `XxxState` / `XxxModel`（domain の型）/ `XxxCommand`（domain。操作の入力）/ `XxxSchema`。定数の表は `as const satisfies`。
- API まわりのファイル名は `character.query.ts` / `quest.mutate.ts` / `character.schema.ts` / `character.mapper.ts`。レスポンスは必ず `parseResponse(result, XxxResponseSchema)` で valibot にかけてから使う。Model と Command は domain に置き、api は DTO → domain の変換だけを持つ。
- 書式は Prettier（1 行 120 文字・ダブルクォート・末尾カンマなし・引数 1 つのアロー関数は括弧なし）。

## 構成と依存
```
src/app → src/pages → src/features/* → src/api → src/domain
                                     ↘ src/domain, src/shared
```
- `domain/`: 純粋な TS。React・通信・`Math.random`・`Date.now`・`throw`・`class` 禁止。失敗は `{ ok: false, reason }` で返す。
- `features/*`: 他の feature を import しない。外に出すものは `index.ts` から（`export { default as X } from "./components/X";`）。
- `pages/`: features と shared を並べるだけ。ルーティングは TanStack Router（`app/router.ts`）。
- サーバのデータは TanStack Query。画面の中で共有する状態は **スコープ付きの Zustand**（`createStore` ＋ Context の Provider。読むときは `use(Context)`。`create` は禁止）。1 つの部品の中だけなら `useState`。
- バリデーションは **valibot**。
- スタイルは CSS Modules ＋ `shared/styles/tokens.css` の CSS 変数。

## 作業の流れ
- コマンド（`web/` で実行）: `pnpm dev`（開発サーバ http://localhost:4100）/ `pnpm check`（型チェック・lint・テストをまとめて実行）/ `pnpm build` / `pnpm lint:fix`
- 作業の最後に `pnpm check` を実行し、すべて通してから完了とする。
- ライブラリは使う時点で追加する（MSW・openapi-fetch は API ができたとき、Howler・Motion はバトルの演出を作るとき）。
- lint のルールを無効化するときは `// eslint-disable-next-line <rule> -- 理由` と理由を必ず書く。
- バトルのエンジンは `../spec/battle/cases/` のゴールデンテストを全件通す。ケースが間違っていると思ったら、実装を変える前にオーナーに相談する。
- 1 つの作業 = 1 つの PR。PR には「何を・なぜ・どう確かめたか」と画面のスクリーンショットを付ける。
