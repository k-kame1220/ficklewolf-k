# バックエンド設計（モジュラーモノリスとレイヤー構成）

> 版: v0.1（2026-10-04）/ 対象: `api/`。バックエンドはオーナーが書く。この文書はオーナーと AI の相談で決めたことの記録。
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
│   │   ├── core/                domain + application（純粋な Kotlin）
│   │   └── adapter/             web（コントローラ）+ persistence（リポジトリの実装）。Spring
│   └── auth/
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
bootstrap ─→ modules/*/adapter ─→ modules/*/core ─→ shared/kernel
                 │                     ↑
                 └──→ platform/* ──────┘（platform は kernel だけに依存）
```

| モジュール | convention plugin | 依存してよいもの |
|---|---|---|
| `shared:kernel` | `k.kotlin-core` | なし |
| `modules:<名前>:core` | `k.kotlin-core` | `shared:kernel`、他モジュールの core（公開 API だけを使う） |
| `modules:<名前>:adapter` | `k.spring-adapter` | 自分の core、`platform:*` |
| `platform:web`・`platform:persistence` | `k.spring-adapter` | `shared:kernel` |
| `bootstrap` | `k.spring-boot-app` | 全部の adapter と platform |

- **core は Spring・DB・HTTP に依存しない。**
- **adapter は他モジュールの adapter・core に依存しない。** 他モジュールのデータが欲しいときは、自分の core から相手の公開 API を呼ぶ。
- **DB のテーブルはモジュールの持ち物。** 他モジュールのテーブルを JOIN・更新しない。
- **platform は機能を知らない。** 例: トークンの照合は auth の仕事なので、`platform:web` には `TokenAuthenticator`（トークン → PlayerId）のインターフェースだけを置き、実装は `auth:adapter` が提供する。

---

## 4. core の中身と公開のしかた

- core の中はパッケージで `domain`（エンティティ・値オブジェクト・ルール）と `application`（ユースケース・ports）に分ける。
- **外に公開するのは「インターフェース」と「組み立て関数」だけ。** ユースケースの実装は `internal` にする（Kotlin の `internal` は Gradle のモジュール単位で効く）。
- ports（リポジトリなどのインターフェース）は、adapter が実装するので公開する。

### 名前の付け方
| 種類 | 名前 | 公開 | 例 |
|---|---|---|---|
| 公開する窓口（抽象） | `<モジュール>Service` の interface | public | `PlayerService` |
| その実装 | `Default<モジュール>Service` | `internal` | `DefaultPlayerService` |
| 組み立て関数 | `<モジュール>Service(...)`（先頭は小文字） | public | `playerService(repository, transaction)` |
| ports | `<対象>Repository` など | public | `PlayerRepository` |

```kotlin
// player:core
interface PlayerService {
    fun createPlayer(name: PlayerName): Player

    fun find(id: PlayerId): Player?
}

fun playerService(
    repository: PlayerRepository,
    transaction: TransactionRunner,
): PlayerService = DefaultPlayerService(repository, transaction)

internal class DefaultPlayerService(
    private val repository: PlayerRepository,
    private val transaction: TransactionRunner,
) : PlayerService { /* … */ }
```

### トランザクション
- core は Spring の `@Transactional` を使わない。`shared:kernel` の `TransactionRunner`（「この処理を 1 つのトランザクションで」）を受け取り、`platform:persistence` で実装する。
- メモリのリポジトリの間は、何もしない `TransactionRunner` を使う。

---

## 5. adapter と組み立て

- adapter の中はパッケージで `web`（コントローラ・リクエスト / レスポンスの型）と `persistence`（リポジトリの実装）に分ける。
- **各モジュールの組み立ては、そのモジュールの adapter の `@Configuration` で行う。** bootstrap は起動するだけ。
- 他モジュールの公開する窓口（例: `PlayerService`）は Bean として受け取る。

```kotlin
// player:adapter
@Configuration
class PlayerConfiguration {
    @Bean
    fun playerService(
        repository: PlayerRepository,
        transaction: TransactionRunner,
    ): PlayerService = playerService(repository, transaction)
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
| 2026-10-04 | 公開する窓口は `<モジュール>Service`（interface）、実装は `Default<モジュール>Service`（`internal`）、組み立て関数は `<モジュール>Service(...)` |

### 不採用にした案
- **外側（presentation・infrastructure）を全モジュールで共通にする**: Gradle のモジュールは少なく済むが、外側では境界をコンパイラで守れない（特に DB で他モジュールのテーブルを触れてしまう）。モジュール数はほぼ変わらないので、境界を守れる core + adapter にした。
- **domain と application を別の Gradle モジュールにする**: core の中のパッケージと `internal` で十分に分けられる。
- **アーキテクチャのテスト（Konsist など）**: 境界のほとんどは Gradle の依存で守れるので、必要になったら入れる。
