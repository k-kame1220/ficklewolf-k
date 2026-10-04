# バックエンド設計（モジュラーモノリスとレイヤー構成）

> 版: v0.3（2026-10-04、core の入口を Service と Api の 2 つに分けた）/ 対象: `api/`。バックエンドはオーナーが書く。この文書はオーナーと AI の相談で決めたことの記録。
> 前提: [00_project-context.md](00_project-context.md)（Kotlin + Spring Boot は必須）、[02_requirements.md](02_requirements.md) §6（API 一覧）

---

## 1. 設計の考え方

1. **モジュラーモノリス。** 1 つのアプリとしてデプロイするが、中身は機能（境界づけられたコンテキスト）ごとのモジュールに分ける。モジュールは他のモジュールの公開 API だけを使い、中身や DB のテーブルには触れない。
2. **境界はコンパイラで守る。** 「使ってはいけない依存」は Gradle のモジュールの依存に入れないことで防ぐ。規約やレビューだけに頼らない。
3. **中心（core）はフレームワークを知らない。** ドメインとユースケースは純粋な Kotlin で書き、Spring・DB・HTTP は外側（adapter）に置く。
4. **依存は引数で渡す。** ユースケースは必要なもの（ports）だけをコンストラクタで受け取る。注入するものは最小限にする（`docs/03` と同じ方針）。

---

## 2. 構成

```
api/
├── build-logic/                 Gradle の共通設定（convention plugin）
├── shared/
│   └── kernel/                  全モジュールで共有する小さな型（PlayerId・TransactionRunner など）。純粋な Kotlin
├── platform/
│   ├── web/                     Web の共通の仕組み（Security・トークンのフィルタの枠・ProblemDetail のエラー処理）
│   └── persistence/             DB の共通の仕組み（接続・TransactionRunner の実装）
├── modules/
│   ├── player/
│   │   ├── api/                 外に約束する窓口（interface と外向けの型）だけ。domain を含まない。純粋な Kotlin
│   │   ├── core/                domain + application。api の窓口を実装する（純粋な Kotlin）
│   │   └── adapter/             web（コントローラ）+ persistence（リポジトリの実装）。Spring
│   └── auth/
│       ├── api/
│       ├── core/
│       └── adapter/
└── bootstrap/                   起動（KApplication）だけ
```

### モジュール（フェーズ 1）
| モジュール | 担当 | 状態 |
|---|---|---|
| `auth` | トークンの発行と照合。外に出すのは「トークン → PlayerId」 | 作成中 |
| `player` | プロフィール（名前・Lv・お札・出撃キャラ）。`/me` | 作成中 |
| `master` | マスタの投入と配信（`/master/version`・`/master`） | 予定 |
| `weather` | 日替わりの天気 | 予定 |
| `character` | 所持キャラ・アイテム・強化 | 予定 |
| `battle` | バトルのルール（純粋な Kotlin。ゴールデンテスト）。core だけ | 予定 |
| `quest` | クエストのセッション・リプレイ検証・報酬 | 予定 |

---

## 3. 依存のルール

```
bootstrap ─→ modules/*/adapter ─→ modules/*/core ─→ modules/*/api ─→ shared/kernel
                 │                     │              ↑（他モジュールの api）
                 │                     └──────────────┘
                 └──→ platform/* ─────────────────────────────→ shared/kernel
```

| モジュール | convention plugin | 依存してよいもの |
|---|---|---|
| `shared:kernel` | `k.kotlin-core` | なし |
| `modules:<名前>:api` | `k.kotlin-core` | `shared:kernel` だけ |
| `modules:<名前>:core` | `k.kotlin-core` | 自分の api、`shared:kernel`、**他モジュールの api** |
| `modules:<名前>:adapter` | `k.spring-adapter` | 自分の core、`platform:*` |
| `platform:web`・`platform:persistence` | `k.spring-adapter` | `shared:kernel` |
| `bootstrap` | `k.spring-boot-app` | 全部の adapter と platform |

- **core は Spring・DB・HTTP に依存しない。**
- **他モジュールに依存するときは、相手の api だけ。** 相手の core（domain・ports・実装）や adapter には依存しない。他モジュールのデータが欲しいときは、自分の core から相手の api の窓口を呼ぶ。
- **api は domain の型を出さない。** やり取りは api に置いた外向けの型（例: `PlayerSummary`）で行う。domain を変えても api の約束が変わらなければ、他モジュールに影響しない。
- **DB のテーブルはモジュールの持ち物。** 他モジュールのテーブルを JOIN・更新しない。
- **platform は機能を知らない。** 例: トークンの照合は auth の仕事なので、`platform:web` には `TokenAuthenticator`（トークン → PlayerId）のインターフェースだけを置き、実装は `auth:adapter` が提供する。

---

## 4. api・core の中身と公開のしかた

- **api**: 他モジュールに約束する窓口（`<モジュール>Api` の interface）と、そこでやり取りする外向けの型だけを置く。失敗しうる操作は `sealed interface` の結果の型で返す（例: `CreatePlayerResult`）。
- **core**: パッケージで `domain`（エンティティ・値オブジェクト・ルール）と `application`（処理・ports・api の実装）に分ける。
- core の中は **2 つの入口**を持つ。

| 入口 | 使う人 | 扱う型 |
|---|---|---|
| `<モジュール>Service` | 自分のモジュールの adapter（コントローラなど）と、`Default<モジュール>Api` | domain の型（`PlayerName`・`Player`） |
| `<モジュール>Api`（の実装 `Default<モジュール>Api`） | 他のモジュール | api の外向けの型（`String`・`PlayerSummary`） |

- **処理の本体は `<モジュール>Service` に書く。** `Default<モジュール>Api` は**変換だけ**をする（外の型 → domain の型にして Service を呼び、domain の型 → 外の型にして返す）。
- **core の中で api の型を import するのは `Default<モジュール>Api` だけ。** domain と Service は api を知らない。api の約束を変えても、直すのは変換役だけで済む。
- 依存の向きは **core → api**（約束を実装するため）。api は core を知らない。他モジュールは api だけに依存し、core には依存しない（Gradle の依存に入れない）。
- `<モジュール>Service` は自分の adapter（別の Gradle モジュール）から使うので public にする。他モジュールは core に依存しないので、外からは見えない。`Default<モジュール>Service`・`Default<モジュール>Api` は `internal`。

```
player:core
├── domain/                 api を知らない
└── application/
    ├── PlayerService.kt     処理の本体（domain の型）。api を知らない
    ├── PlayerRepository.kt  ports
    └── DefaultPlayerApi.kt  外と中の変換役。ここだけが api を知っている
```

### 名前の付け方
| 種類 | 名前 | 置き場所 | 公開 | 例 |
|---|---|---|---|---|
| 他モジュールへの窓口（抽象） | `<モジュール>Api` の interface | api | public | `PlayerApi` |
| 外向けの型 | `<対象>Summary`・`<操作>Result` など | api | public | `PlayerSummary`・`CreatePlayerResult` |
| 窓口の実装（変換だけ） | `Default<モジュール>Api` | core | `internal` | `DefaultPlayerApi` |
| 処理の本体（抽象） | `<モジュール>Service` の interface | core | public | `PlayerService` |
| 処理の本体の実装 | `Default<モジュール>Service` | core | `internal` | `DefaultPlayerService` |
| 組み立て関数 | `<モジュール>Service(...)`・`<モジュール>Api(...)`（先頭は小文字） | core | public | `playerService(repository, transaction)`・`playerApi(playerService)` |
| ports | `<対象>Repository` など | core | public | `PlayerRepository` |

```kotlin
// player:api（domain の型を使わない）
interface PlayerApi {
    fun createPlayer(name: String): CreatePlayerResult

    fun find(id: PlayerId): PlayerSummary?
}

// player:core — 処理の本体（domain の型）
interface PlayerService {
    fun createPlayer(name: PlayerName): Player

    fun find(id: PlayerId): Player?
}

fun playerService(
    repository: PlayerRepository,
    transaction: TransactionRunner,
): PlayerService = DefaultPlayerService(repository, transaction)

// player:core — 他モジュール向けの窓口（変換だけ）
fun playerApi(playerService: PlayerService): PlayerApi = DefaultPlayerApi(playerService)

internal class DefaultPlayerApi(
    private val playerService: PlayerService,
) : PlayerApi {
    override fun createPlayer(name: String): CreatePlayerResult {
        val playerName = PlayerName.of(name) ?: return CreatePlayerResult.InvalidName
        return CreatePlayerResult.Created(playerService.createPlayer(playerName).toSummary())
    }

    override fun find(id: PlayerId): PlayerSummary? = playerService.find(id)?.toSummary()
}
```

### トランザクション
- core は Spring の `@Transactional` を使わない。`shared:kernel` の `TransactionRunner`（「この処理を 1 つのトランザクションで」）を受け取り、`platform:persistence` で実装する。
- メモリのリポジトリの間は、何もしない `TransactionRunner` を使う。

---

## 5. adapter と組み立て

- adapter の中はパッケージで `web`（コントローラ・リクエスト / レスポンスの型）と `persistence`（リポジトリの実装）に分ける。
- **各モジュールの組み立ては、そのモジュールの adapter の `@Configuration` で行う。** bootstrap は起動するだけ。
- 他モジュールの公開する窓口（例: `PlayerApi`）は Bean として受け取る。

```kotlin
// player:adapter
@Configuration
class PlayerConfiguration {
    @Bean
    fun playerService(
        repository: PlayerRepository,
        transaction: TransactionRunner,
    ): PlayerService = playerService(repository, transaction) // 自分の adapter（コントローラ）が使う

    @Bean
    fun playerApi(playerService: PlayerService): PlayerApi = playerApi(playerService) // 他モジュールが使う
}
```

### 認証
- `platform:web` に、Security の設定・トークンのフィルタ・`TokenAuthenticator`（インターフェース）・`AuthenticatedPlayer(playerId)`・`@CurrentPlayer` を置く。
- `auth:adapter` が `TokenAuthenticator` を実装する（`auth:core` の照合のユースケースを使う）。
- 各モジュールのコントローラは `@CurrentPlayer` で PlayerId だけを受け取る（auth を知らない）。

---

## 6. パッケージ

```
com.ficklewolf.k                          KApplication（コンポーネントスキャンの起点）
com.ficklewolf.k.shared.kernel
com.ficklewolf.k.platform.web / .platform.persistence
com.ficklewolf.k.<モジュール>.domain       core の中
com.ficklewolf.k.<モジュール>.application  core の中
com.ficklewolf.k.<モジュール>.adapter.web / .adapter.persistence
```

モジュール名を先、層を後にする。どのモジュールのものかがパッケージ名で分かるようにするため。

---

## 7. Gradle

- 共通設定は `build-logic` の convention plugin にまとめ、各モジュールの `build.gradle.kts` は plugin と依存だけを書く。プラグインのバージョンは `build-logic/build.gradle.kts` の 1 か所で管理する。

| plugin | 使う場所 | 中身 |
|---|---|---|
| `k.kotlin-core` | kernel・各 core | Kotlin（JVM）・Java 21・ktlint・JUnit |
| `k.spring-adapter` | 各 adapter・platform | `k.kotlin-core` ＋ `plugin.spring`・Spring Boot の BOM・`-Xjsr305=strict`。実行はしない |
| `k.spring-boot-app` | bootstrap | `k.spring-adapter` ＋ Spring Boot のプラグイン（実行可能な jar） |

- **jar 名はプロジェクトのパスから付ける**（例: `modules-player-core`）。`core`・`adapter` という同じ名前のモジュールが並ぶので、そのままだと実行可能な jar の中で衝突する。
- **group もプロジェクトのパスから付ける**（例: `:modules:auth:core` → `com.ficklewolf.k.modules.auth`）。Gradle はモジュールを「group・名前・version」で見分けるので、group が同じだと `auth:core` から `player:core` への依存を自分自身への依存と取り違え、循環した依存のエラーになる（jar 名を変えても見分けには効かない）。

---

## 8. 決定事項

| 日付 | 内容 |
|---|---|
| 2026-10-04 | モジュラーモノリスにする。モジュールは `auth` と `player` から始める（認証とプロフィールを分ける） |
| 2026-10-04 | core（domain + application）は Spring に依存しない。トランザクションは `TransactionRunner` で表す |
| 2026-10-04 | 各モジュールを **core と adapter** の 2 つの Gradle モジュールに分け、横断的な仕組みは `platform` に置く |
| 2026-10-04 | 他モジュールへの窓口は `<モジュール>Api`（interface。api に置く）、実装は `Default<モジュール>Api`（`internal`。core に置く）、組み立て関数は `<モジュール>Api(...)`。`Service` は core の中の処理（ユースケース）の名前と紛れ、Spring の `@Service` とも紛れるので使わない |
| 2026-10-04 | 各モジュールに **api（契約）** を足し、api・core・adapter の 3 つにする。他モジュールへの依存は相手の api だけ。api は domain の型を出さず、外向けの型で約束する（モジュラーモノリスの標準の形） |
| 2026-10-04 | core の入口を 2 つにする。処理の本体は `<モジュール>Service`（domain の型。自分の adapter が使う）、他モジュール向けは `Default<モジュール>Api`（変換だけ）。core の中で api の型を知るのは変換役だけ |

### 不採用にした案
- **外側（presentation・infrastructure）を全モジュールで共通にする**: Gradle のモジュールは少なく済むが、外側では境界をコンパイラで守れない（特に DB で他モジュールのテーブルを触れてしまう）。モジュール数はほぼ変わらないので、境界を守れる core + adapter にした。
- **domain と application を別の Gradle モジュールにする**: core の中のパッケージと `internal` で十分に分けられる。
- **他モジュールの core に直接依存する**: 相手の domain・ports まで見えてしまい、domain の変更が他モジュールに広がる。api（契約）を挟む形にした。
- **使う側がインターフェースを持つ（依存性の逆転）**: 使う側ごとにつなぎ役のクラスが要る。モジュラーモノリスの標準である api（契約）の形にした。
- **アーキテクチャのテスト（Konsist など）**: 境界のほとんどは Gradle の依存で守れるので、必要になったら入れる。
