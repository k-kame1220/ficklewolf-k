# フロントエンド設計（レイヤー構成とコーディングルール）

> 版: v0.4（2026-09-26、spec（ゴールデンテスト・マスタ）に合わせて更新）/ 前提: [02_requirements.md](02_requirements.md) §4・§9（D-1: ルールは別々に実装、D-2: React + TS + Capacitor）
> 対象: `web/`。フロントは AI が実装する。このルールは AI が守るものであり、オーナーのレビューの基準にもなる。

---

## 1. 設計の考え方

1. **ゲームのルールと画面を分ける。** バトル・ステータス計算は React を知らない純粋な TypeScript にする。ゴールデンテストで検証するのはこの部分。
2. **状態の置き場所を種類ごとに決める。** サーバのデータ / バトルの状態 / 画面だけの状態を混ぜない。
3. **依存の向きは一方通行。** 上のレイヤーは下のレイヤーを使えるが、逆は禁止。lint で機械的にチェックする。
4. **演出は「イベントの再生」にする。** エンジンが返したイベント（ダメージ・バフ・属性変化…）を順番に演出する。ルールとアニメーションのタイミングを混ぜない（旧作の `GameDirector` の反省）。

---

## 2. レイヤー構成

```
web/src/
├── app/        アプリの起動・ルーティング・Provider・グローバル CSS
├── pages/      画面（S-01〜S-14）。ルートごとに 1 つ。部品を組み合わせるだけ
├── features/   機能単位のまとまり（battle, quest-list, character, enhance, home, auth, settings）
├── api/        サーバとの通信（OpenAPI の生成コード・TanStack Query のフック・DTO→ドメインの変換・MSW モック）
├── domain/     ゲームのルール（純粋な TS。React・通信・ブラウザ API に依存しない）
└── shared/     汎用の部品（UI の基本部品・音・素材・ユーティリティ）
```

### 依存ルール

```
app → pages → features → api ─→ domain
                  │         └──→ shared
                  ├──────────→ domain
                  └──────────→ shared
domain → （何にも依存しない）
shared → （外部ライブラリのみ）
```

| レイヤー | 使ってよいもの | 禁止 |
|---|---|---|
| `app` | 全部 | — |
| `pages` | features, shared | api・domain を直接使うこと（features を経由する） |
| `features` | api, domain, shared | **他の feature を直接 import すること**（組み合わせは pages で行う） |
| `api` | domain（型と変換先）, shared | React コンポーネント |
| `domain` | なし（標準の TS だけ） | React, fetch, `Date.now()`, `Math.random()`, `window`, `localStorage` |
| `shared` | 外部ライブラリ | ゲーム固有の知識（キャラ・クエストなど） |

- 各 feature は `index.ts` で公開するものを決める。外からは `features/battle` だけを import し、`features/battle/components/xxx` を直接触らない。
- ルールは `eslint-plugin-boundaries` で CI 時にチェックする（`web/eslint.config.ts`）。

---

## 3. 各レイヤーの中身

### 3.1 domain/ — ゲームのルール
```
domain/
├── master/        マスタの型（`spec/master` の形に合わせる）と読み取り関数
├── attribute/     属性相性（陽 > 音 > 月 > 陽）
├── player/        プレイヤーの型（PlayerModel・CreateGuestCommand・UpdatePlayerCommand）と名前のルール
├── stats/         ステータス計算（HP・攻撃・防御 = 基礎 + アイテム + 被り + 天気。係数は `spec/master/settings.json`）
├── battle/
│   ├── types.ts            コマンド・プレイヤーと敵の設定・状態（BattleState）・イベント（BattleEvent）・理由コード
│   ├── engine.ts           createBattle(setup) と step(state, command) → { ok: true, state, events } | { ok: false, reason }
│   ├── enemyAction.ts      敵の行動 15 種の処理と、ダメージ・攻撃力の計算
│   ├── rng.ts              mulberry32（状態を引数と戻り値で受け渡す純粋関数）
│   ├── engine.golden.test.ts  spec/battle/cases を全件読み込んで 1 手ずつ比べる
│   └── rng.test.ts         spec/battle/rng のテストベクタ
```
- **アプリの中で使う型（`XxxModel`）と操作の入力（`XxxCommand`）は domain に置く**（Shackw の wallet-app と同じ）。API の形（DTO）は domain に持ち込まない。
- **すべて純粋関数**。入力が同じなら結果も同じ。状態は `readonly` で、書き換えずに新しいオブジェクトを返す。
- 乱数は状態（`rngState`）として持ち回り、現在時刻は引数で受け取る。
- 実行できないコマンドは例外にせず、**理由付きの結果**を返す: `{ ok: false, reason: 'NO_CHECKPOINT' }`。画面はこれを見てメッセージを出す（旧作の「チェックポイントがありません。」など）。
- ゴールデンテスト（`spec/battle/cases/*.json`）は `domain/battle` に対して直接実行する。ルールの正は `spec/battle/README.md`。

### 3.2 api/ — 通信
```
api/
├── generated/schema.ts   OpenAPI から生成した型（`pnpm api:generate`。手で編集しない。コミットする）
├── core/                 どの resource でも使うもの
│   ├── config.ts         基点 URL・モックを使うか（環境変数から読む）
│   ├── client.ts         openapi-fetch のクライアント（認証トークンの付与・401 でトークンを消す）
│   ├── apiError.ts       ApiError（`status` と `code`）と InvalidResponseError（本文が OpenAPI の形と違う）
│   ├── response.ts       parseResponse（レスポンスを確かめて本文を返す）
│   └── authToken.ts      認証トークンの読み書き（shared/storage を使う）
├── auth/                 OpenAPI の tag ごとにフォルダを分ける
│   ├── auth.schema.ts    レスポンスの valibot のスキーマ
│   ├── auth.mutate.ts    ゲスト作成（`createGuest` と `useCreateGuest`）
│   ├── auth.mock.ts      MSW のハンドラ
│   └── auth.test.ts
├── me/
│   ├── me.keys.ts        TanStack Query のクエリキー
│   ├── me.schema.ts      レスポンスの valibot のスキーマ（`MeResponseSchema`）
│   ├── me.mapper.ts      DTO → domain の型（`meResponseToDomain` → `PlayerModel`）
│   ├── me.query.ts       取得（`fetchMe` と `useMe`）
│   ├── me.mutate.ts      変更（`updateMe` と `useUpdateMe`）
│   ├── me.mock.ts        MSW のハンドラ
│   └── me.test.ts
└── mocks/                MSW の組み立て（`db.ts` = モックの DB と共通の関数、`handlers.ts` = 全 resource のハンドラをまとめる、`browser.ts` = 開発用、`node.ts` = テスト用）
```
- **resource（OpenAPI の tag）ごとにフォルダを分ける。** 1 つの resource に関するもの（取得・変更・変換・キー・モック・テスト）は同じフォルダに置く。features とは分けない（`/me` はホーム・名前変更・キャラなど複数の feature から使うため）。
- **サーバの状態は TanStack Query だけで持つ**（別のストアに複製しない）。
- 画面やドメインは DTO の型を使わない。`*.mapper.ts`（`xxxResponseToDomain`）で domain の `XxxModel` に変換してから渡す。API が変わっても影響を `api/` の中に閉じ込めるため。
- 通信する関数の入力は domain の `XxxCommand` で受け取る。
- **レスポンスは信用しない。** 生成した型は「そう書いてある」だけなので、本文は必ず `parseResponse(result, XxxResponseSchema)` で valibot にかけてから使う。通信する関数は次の形にそろえる。
  ```ts
  const result = await apiClient.GET("/me");
  const body = parseResponse(result, MeResponseSchema);   // エラーなら ApiError、形が違えば InvalidResponseError
  return meResponseToDomain(body);
  ```
- スキーマの型は `v.GenericSchema<unknown, components["schemas"]["Xxx"]>` と書き、OpenAPI から生成した型とずれたら型チェックで気づけるようにする。未知の項目は `v.object` で捨てる（api に項目が増えても古いアプリが壊れないように）。
- **api が外部との境界**。wallet-app の ports・infrastructure・DI コンテナは作らない（外部は api と端末保存だけで、テストの差し替えは MSW が通信の手前で行うため）。外部が増えたら見直す。
- 通信する関数（`fetchMe` など）と、それを包むフック（`useMe` など）を同じファイルに置く。関数はテストで直接呼べる。
- api がエラーを返したら `ApiError` を投げる。画面は `code` を見てメッセージを決める。通信そのものの失敗（オフラインなど）は `ApiError` にならない。
- **生成した型は OpenAPI とずれないようにする。** `pnpm check` の最初に `pnpm api:check` で確かめる（OpenAPI を変えたら `pnpm api:generate` してコミットする）。

#### モック（MSW）
- 開発サーバー（`pnpm dev`）は、既定で MSW のモックを使う。本物の api につなぐときは `web/.env.development.local`（git の対象外）に `VITE_API_MOCK=false` を書く。基点 URL は `VITE_API_BASE_URL`（既定は `http://localhost:8080`）。
- モックはプレイヤーとトークンをメモリに持つ。**ページを読み直すとモックの中身は消える**ので、保存済みのトークンは 401 になり、名前登録からやり直しになる（401 の流れの確認にもなる）。
- テストは `src/test/setup.ts` で Node 用の MSW を起動し、テストごとに空の状態のハンドラを入れ直す。知らない通信はエラーにする。
- 本番のビルドにはモックを含めない（`import.meta.env.DEV` のときだけ読み込む）。
- モック（`mocks/` と `*.mock.ts`）の中だけは、DB の代わりとして `Map` の書き換えを許可している（`eslint.config.ts`）。

#### 認証トークン
- `POST /auth/guest` で受け取ったトークンを `shared/storage` に保存し、`client.ts` が毎回 `Authorization: Bearer` に付ける。
- 401 が返ったらトークンを消す。画面は名前登録に戻す（「データが見つかりませんでした」）。

### 3.3 features/ — 機能
```
features/battle/
├── index.ts           公開するもの（BattleScreen の中身など）
├── components/        バトル画面の部品（EnemyPanel, CommandPanel, MessageBox, HpBar, CutIn…）
├── hooks/             useEventPlayer（演出の再生）など、複数の部品で使うものだけ
├── store.ts           バトル画面のスコープのストア（createStore ＋ Context。§4）
├── messages.ts        イベント → 表示文言（「A の攻撃。 120 ダメージあたえた。」）
└── *.module.css
```
- **バトルの流れ**: ボタン → その場で `engine.step` を呼ぶ → 新しい state と events をストアに入れる → `useEventPlayer` がイベントを 1 つずつ演出（揺れ・SE・HP バー・文言）→ 全部終わったら次の入力を受け付ける。
- 演出の長さや間の取り方は features 側で決める。domain は時間を知らない。

### 3.4 pages/ — 画面
- ルートごとに 1 ファイル（`QuestListPage.tsx` など）。features の部品を並べ、画面遷移を行うだけ。
- ルートは TanStack Router でコードに定義し（`app/router.ts`）、各ページは `lazyRouteComponent` で分割して読み込む。

### 3.5 shared/ — 共通
```
shared/
├── ui/        Button, Modal, Tabs, Gauge, Dialog…（見た目だけ。ゲームの知識なし）
├── sound/     Howler のラッパー（BGM の切り替え・SE・音量・iOS の自動再生制限への対応）
├── assets/    素材のキーから URL を組み立てる・先読み（同梱素材のマニフェストと取得素材の基点 URL。`docs/02` §10）
├── storage/   端末保存の抽象化（Web は localStorage、アプリは Capacitor Preferences）
├── styles/    デザイントークン（色・余白・文字サイズ・アニメ時間）
└── lib/       小さな関数（型ガード・フォーマット…）
```

---

## 4. 状態管理のルール

| 種類 | 例 | 置き場所 |
|---|---|---|
| サーバのデータ | プロフィール、所持キャラ、マスタ、天気 | TanStack Query |
| 画面・機能の中で共有する状態 | バトル中の HP・バフ・イベントの再生状況 | **スコープ付きの Zustand ストア**（下記） |
| 端末に残す設定 | 音量、認証トークン | `shared/storage`（Web は localStorage、アプリは Capacitor Preferences） |
| 1 つの部品の中だけの状態 | タブの選択、モーダルの開閉、入力中の値 | `useState` |
| URL で表せる状態 | 選択中のクエスト ID・キャラ ID | ルートのパラメータ |

### Zustand はスコープを持たせる（`useContext` と同じ粒度）
- **アプリ全体で 1 つのストア（`create()` で作るグローバルなフック）は作らない。** lint で `zustand` の `create` を禁止している。
- ストアは `createStore` で作り、**そのスコープの Provider の中で `useState(() => createXxxStore(...))` して Context で配る**。スコープを抜けるとストアも消える。
- 使う側は `useXxxStore(selector)` で読む。Provider の外で使ったらエラーにする。
- スコープの例: バトル画面（`BattleStoreProvider`）、強化画面（`EnhanceStoreProvider`）。
```tsx
// features/battle/store.ts
export const createBattleStore = (initial: BattleState) =>
  createStore<BattleStoreState>()(set => ({ battle: initial, apply: next => { set({ battle: next }); } }));
export const BattleStoreContext = createContext<StoreApi<BattleStoreState> | null>(null);
export const useBattleStore = <T,>(selector: (s: BattleStoreState) => T): T => {
  const store = use(BattleStoreContext); // React 19 の use（useContext と同じ）
  if (store === null) throw new Error("useBattleStore は BattleStoreProvider の内側で使ってください。");
  return useStore(store, selector);
};

// features/battle/components/BattleStoreProvider.tsx
const BattleStoreProvider = (props: BattleStoreProviderProps) => {
  const { initial, children } = props;

  const [store] = useState(() => createBattleStore(initial));

  return <BattleStoreContext value={store}>{children}</BattleStoreContext>;
};

export default BattleStoreProvider;
```

### 使わないもの
- **sessionStorage・cookie・IndexedDB は使わない。** 端末に保存するのは設定と認証トークンだけで、`shared/storage` を通す（lint で禁止）。
- Zustand の `persist` ミドルウェアは使わない。

## 5. コーディングルール

### 5.0 書き方の基本方針（オーナーの方針・最優先）

1. **上から順に読める実装にする。** 読む人の目が上下に行き来しないように、処理は起きる順に上から書く。
2. **むやみに関数に切り出さない。** 一度しか使わない処理を小さな関数に分けると、意図が別の場所に散って読みにくくなる。切り出してよいのは次の場合だけ。
   - 2 か所以上で使う
   - ゲームのルールそのもの（domain に置く）
   - テストで単体を検証したい
3. **値を組み立てる処理は即時実行関数（IIFE）で書く。** 分岐して値を決めるときは、`let` で宣言して後から代入せず、その場で IIFE にする。
   ```ts
   // ✕ どこで値が決まったか追いにくい
   let label = "";
   if (hp <= 0) { label = "たおれた"; } else { label = `HP ${String(hp)}`; }

   // ○ 値が決まる場所が 1 か所
   const label = (() => {
     if (hp <= 0) return "たおれた";
     return `HP ${String(hp)}`;
   })();
   ```
4. **書き換えない（イミュータブル）。** `let` は使わない（lint で禁止）。配列・オブジェクトの破壊的変更（`push`, `splice`, 代入など）もしない。新しい値を作って返す。`++` / `--` も使わない。
5. **計算量を意識する。** `some` / `every` / `find` / `includes` / `indexOf` などの線形探索は使わず、**`Map` / `Set` を先に作って `has` / `get` で O(1) で引く**（lint で禁止。どうしても必要なら理由を書いて無効化）。ループの中で探索を重ねない。
   ```ts
   // ✕ ループのたびに O(n)
   const owned = characters.filter(c => ownedIds.includes(c.id));
   // ○ Set で O(1)
   const ownedIdSet = new Set(ownedIds);
   const owned = characters.filter(c => ownedIdSet.has(c.id));
   ```
6. **必要のないものは使わない。** sessionStorage のように要らない仕組みを持ち込まない。ライブラリを増やすときは理由を説明できること。
7. **`web/` の中は TS で統一する。** アプリのコードだけでなく、設定ファイル（`eslint.config.ts`, `prettier.config.ts`, `vite.config.ts`）も TS で書く。旧作からの移行スクリプト（データ抽出・素材の変換）は `legacy/tools/` に Python で置く。
8. **コメントはインターフェースと型定義にだけ書く。** 処理の中にはコメントを書かず、名前と構造で意図を表す（多くあっても読まれず、読むならソースを読む）。設定ファイル・CSS・スクリプトも同じ。例外は次の 2 つだけ。
   - **インターフェースと型定義には TSDoc（`/** ... */`）を書く。** 対象は、ファイルの外に公開する型・props の型・ストアの型・公開する関数（`export` するもの）。エディタで使う側に表示され、中を読まなくても使い方が分かるようにする。
     - 書くのは「何を表すか・何をするか」と、名前から分からない約束事（単位・範囲・`null` の意味・いつ変わるか・失敗したとき）。「どう実装したか」は書かない。
     - 型の各項目は、名前だけで意味が分からないものに書く（`hp` には要らない。`turn` が 1 始まりであることや、`maxHp` が回復で増えることには書く）。
     - テストのファイルと、ファイルの中だけで使う型・関数には書かない。
   - lint を無効化するときの理由（`-- 理由`）。

   ```ts
   /** バトルの 1 コマンドを処理する。状態は書き換えず、新しい状態と起きたことを返す。 */
   export const step = (state: BattleState, command: Command): StepResult => { ... };

   export type BattleState = {
     /** 連戦の何戦目か（1 始まり） */
     readonly stage: number;
     /** 今の敵の何ターン目か（1 始まり）。リターンで戻る */
     readonly turn: number;
     ...
   };
   ```
9. **マジックナンバーは使わない。** 数値は名前を付けた定数にする。定数の名前は言語の慣習に従う（TS・Python は `UPPER_SNAKE_CASE`、CSS はデザイントークンの変数）。TS は lint で検出する（0・1・-1 とテストは対象外）。

### 5.1 TypeScript
- tsconfig は shackw と同じく `tsconfig.app.json`（src）と `tsconfig.node.json`（設定ファイル）に分ける。`strict` と shackw の設定（`erasableSyntaxOnly`, `noUncheckedSideEffectImports` など）に加えて、`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noImplicitReturns` を有効にする。
- **`any` は禁止。** 外から来る値（api のレスポンス、端末に保存した値、ゴールデンテストの JSON）は `unknown` で受けて **valibot で検証**する。
  - lint: `no-explicit-any`・`no-unsafe-*`（any の代入・引数・呼び出し・メンバー参照・戻り値）・`no-unsafe-type-assertion`。
  - 標準の型で any を返す `JSON.parse` と `Response.json()` は、`src/app/builtins.d.ts` で unknown を返すように上書きしている。
  - tsconfig: `strict` に加えて `noUncheckedIndexedAccess`・`exactOptionalPropertyTypes`・`noImplicitReturns`・`noImplicitOverride`・`allowUnreachableCode: false`・`allowUnusedLabels: false` など。`noPropertyAccessFromIndexSignature` は CSS Modules（`styles.root`）とぶつかるので使わない。
- 型の種類はユニオン（判別可能ユニオン）で表す。`enum` は使わない（`as const` のオブジェクトかユニオンで書く）。定数の表は `as const satisfies` で型を確かめる。
- 型は `type` で書く。名前は `XxxProps`（props）/ `XxxContextType`（Context）/ `XxxState`（ストアの状態）/ `XxxModel`（domain の型。アプリの中で使う形）/ `XxxCommand`（domain。操作の入力）/ `XxxSchema`（valibot のスキーマ）。
- `class` は `Error` を継承するとき（`ApiError` など）だけ使う。
- `switch` で判別するときは網羅チェックをする（lint の `switch-exhaustiveness-check`）。
- 非 null アサーション（`!`）と `as` による型の上書きは原則禁止。使う場合は理由をコメントに書く。

### 5.2 React
- 関数コンポーネントとフックだけを使う。コンポーネントは shackw と同じ形で書く。
  ```tsx
  type CommandPanelProps = {
    disabled: boolean;
  };

  const CommandPanel = (props: CommandPanelProps) => {
    const { disabled } = props;            // props は 1 行目で分割代入する
    const battle = useBattleStore(s => s.battle);

    const hpLabel = (() => {               // 分岐して決める値は IIFE
      if (battle.hp <= 0) return "たおれた";
      return `HP ${String(battle.hp)}`;
    })();

    return <p>{hpLabel}</p>;
  };

  export default CommandPanel;             // 1 ファイル 1 コンポーネントで default export
  ```
- 1 行の `if (...) return ...;` は波括弧を付けない（early return）。
- ゲームのルールは domain に置く。それ以外の画面の処理は、コンポーネントの中に上から順に書く。フックに切り出すのは複数の部品で使う場合だけ。
- 1 ファイル 1 コンポーネント。分けるのは**画面の区切り（見た目のまとまり）**で行い、ロジックを細かい関数やフックに切り出して行数を減らすことはしない（§5.0）。
- **分割の粒度は shackw と同じ**。画面（page）は「セクション」単位の部品を並べるだけにする。セクションに子部品があるときはフォルダにし、`index.tsx` と、親の名前を頭に付けた子部品を置く。
  ```
  features/battle/components/
  ├── EnemyPanel/
  │   ├── index.tsx              ← セクション本体
  │   ├── EnemyPanelHpBar.tsx    ← 子部品は親の名前を頭に付ける
  │   └── EnemyPanelImage.tsx
  ├── CommandPanel/
  │   ├── index.tsx
  │   └── CommandPanelButton.tsx
  └── MessageBox.tsx             ← 子部品が無ければファイル 1 つ
  ```
- `useEffect` はブラウザや外部との同期（音・タイマー・購読）にだけ使う。データ取得は TanStack Query、値の計算は描画中に行う。
- props のバケツリレーが 3 段を超えたら、構成を見直すかストアを使う。

### 5.3 命名とファイル
| 対象 | 規則 | 例 |
|---|---|---|
| feature のディレクトリ | kebab-case | `quest-list/` |
| コンポーネントのフォルダ | PascalCase（`index.tsx` を置く） | `EnemyPanel/` |
| コンポーネント | PascalCase.tsx | `CommandPanel.tsx` |
| フック | `use` + camelCase.ts | `useEventPlayer.ts` |
| その他の TS | camelCase.ts | `enemyActions.ts` |
| API まわり | `名前.種類.ts`（shackw と同じ） | `character.query.ts`, `quest.mutate.ts`, `character.schema.ts`, `character.mapper.ts` |
| CSS | コンポーネント名.module.css | `CommandPanel.module.css` |
| 型 | PascalCase。`I` などの接頭辞は付けない | `BattleState` |
| 定数 | UPPER_SNAKE_CASE | `MAX_CHECK_COUNT` |
- コンポーネント・フックは **1 ファイル 1 つを default export**（ファイル名 = 名前）。feature の `index.ts` では `export { default as CommandPanel } from "./components/CommandPanel";` の形で公開する。
- 1 つのファイルから複数出すもの（ストア・スキーマ・定数・ドメインの関数）は named export。
- ゲーム用語のコード上の名前は `spec/battle/README.md` の「用語とコード上の名前」に揃える（例: リターン = `rewind`、必殺技（プレイヤー）= `special`、敵の必殺技 = `deathblow`、陽 / 音 / 月 = `yang` / `note` / `moon`）。画面だけの用語は みえーるみえーる = `reveal`。

### 5.4 スタイル
- **CSS Modules ＋ CSS 変数（デザイントークン）**。色・余白・アニメ時間は `shared/styles/tokens.css` からだけ取る。
- 画面は縦長のスマホが基準（幅 390px 前後）。最大幅 480px で中央に表示し、PC ではその外側を背景で埋める。
- タップできる要素は 44px 以上。ボタンは `<button>` を使う。
- アニメーションは Motion か CSS。`prefers-reduced-motion` のときは揺れ・点滅を弱める。

### 5.5 テスト
| 対象 | ツール | 基準 |
|---|---|---|
| domain（バトル・ステータス） | Vitest | **ゴールデンテストを全件通す**。分岐はすべてテストする |
| features のフック・部品 | Vitest + Testing Library + MSW | 主な操作（コマンドを押す → 表示が変わる）を確認する |
| 画面の通し | Playwright | ログイン → クエスト → 勝利 → 報酬、の主な流れを数本 |
- テストファイルは対象の隣に `*.test.ts(x)` で置く。テストの書き方は `it` に統一し、`describe` で囲む。

### 5.6 品質ツール
- ESLint 10（`web/eslint.config.ts`）＋ Prettier（`web/prettier.config.ts`。shackw と同じ書式: 1 行 120 文字・ダブルクォート・末尾カンマなし・引数 1 つのアロー関数は括弧なし）。Prettier は ESLint から実行する（eslint-plugin-prettier）。
- React のルールは `@eslint-react/eslint-plugin`（ESLint 10 対応。フックのルールも含む）。`eslint-plugin-react`・`jsx-a11y` は ESLint 10 に未対応のため使わない。
- TypeScript は 6.0 系（typescript-eslint の対応範囲。7.0 は未対応）。
- `pnpm` でパッケージを管理する。
- コミット前に lint・型チェック・テストを実行する（CI でも同じもの）。
- コミットメッセージは Conventional Commits（`feat(battle): リターンの実装` など）。

### 5.7 その他
- 文言は日本語のみ。多言語化はしないが、文言は各 feature の `messages.ts` などにまとめ、コンポーネントに直接書き散らさない。
- エラー表示: 通信エラーは共通のダイアログ（リトライ / タイトルへ）。旧作の文言を流用する。
- 素材は 2 種類（`docs/02` §10）。同梱素材は `web/` にコミットし、取得素材はマスタに書かれたキーと基点 URL（設定）から組み立てて取得する。どちらも型付きのマニフェスト・キーから参照し、パスを文字列で直接書かない。
- バトル画面に入る前に、その戦闘で使う画像・音を先読みする。

---

## 6. AI 駆動開発の進め方（フロント）

- `web/CLAUDE.md` が AI の毎回参照するルール。
- 1 つの作業 = 1 つの PR。PR には「何を・なぜ・どう確かめたか」と画面のスクリーンショットを付ける。
- オーナーは主に**動作とルールの一致**を確認する。コードの細部は lint とテストに任せる。

---

## 7. 決定事項

| ID | 内容 | 決定（2026-09-25） |
|---|---|---|
| F-1 | スタイルの方式 | CSS Modules ＋ CSS 変数（shackw は Tailwind だが、K はゲーム画面なので CSS Modules を維持） |
| F-2 | リポジトリ構成 | **モノリポ**（git は K/ に 1 つ）。ただし各プロジェクトのツールはそのフォルダの中で完結させ、直下には `.gitignore` 以外を置かない。共有する約束事（OpenAPI・ゴールデンテスト）は `spec/` に置き、`web`・`api` から相対パスで参照する。`web/src` は pages / features 構成（shackw の routes 同居型にはしない） |
| F-3 | パッケージ管理 | pnpm |
| F-4 | バリデーション | valibot（zod は lint で禁止） |
| F-5 | Zustand | スコープ付き（createStore ＋ Context）。グローバルなストアは禁止 |
| F-6 | ESLint | 10 系。React のルールは @eslint-react |
| F-7 | 言語 | `web/` の中は TS で統一（設定ファイルも TS）。移行スクリプトは `legacy/tools/` に Python |
| F-9 | pnpm | `web/` 単体のプロジェクト（lockfile・設定も `web/` の中）。直下に pnpm のワークスペースは作らない |
| F-8 | 書き方 | shackw（portal-web-app / wallet-web-app）の書き方に合わせる（§5.2・§5.3）。ただし §5.0 の方針が優先 |

---

## 8. ESLint で機械的に守らせるルール（`web/eslint.config.ts`）

| 方針 | ルール |
|---|---|
| 書き換えない | `functional/no-let`, `functional/immutable-data`, `no-param-reassign`, `no-plusplus`, `prefer-const` |
| 上から読める | `no-nested-ternary`（→ IIFE で書く）, `no-else-return`, `max-depth: 3` |
| マジックナンバー | `@typescript-eslint/no-magic-numbers`（0・1・-1 以外は定数にする。テストは対象外） |
| 計算量 | `some`/`every`/`find`/`findIndex`/`findLast`/`findLastIndex`/`includes`/`indexOf`/`lastIndexOf` の呼び出しを禁止 |
| 型 | typescript-eslint strict＋stylistic（型情報あり）, `as` 禁止（`as const` は可）, `!` 禁止, `enum` 禁止, `class` は Error の継承だけ, `switch` の網羅チェック, 真偽値の厳密化, 型は `type` で書く |
| レイヤー | eslint-plugin-boundaries（§2 の表）, feature の内部への直接 import 禁止, 2 階層以上さかのぼる相対 import 禁止 |
| domain の純粋さ | React・状態管理・通信ライブラリの import 禁止, `Math.random`・`Date.now`・`new Date`・`throw`・`window`・`fetch`・`setTimeout` 禁止 |
| 状態・保存 | `zustand` の `create`・`persist` 禁止, `sessionStorage`・`cookie` 禁止, `localStorage`・`indexedDB` は `shared/storage` だけ |
| ライブラリ | `zod`・`lodash`・`axios` 禁止 |
| import | 循環 import 禁止, 未使用 import の削除（unused-imports）, 並び順の統一（shackw と同じ。型の import は最後）, 型は `import type` |
| React | @eslint-react strict（型情報あり）: `key` 必須・index を key にしない, `<button type>` 必須, フックのルール・依存配列（error）, Context の value を毎回作らない, 条件付き描画の `0` 漏れ防止 |
| 無効化コメント | 理由（`-- 理由`）必須, ファイル全体の無効化禁止, 不要になった無効化はエラー |
| テスト | vitest 推奨ルール, `it` に統一, `.only`・`.skip` を残さない |
| 書式 | Prettier（ESLint から実行） |
