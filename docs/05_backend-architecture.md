# バックエンド設計（モジュラーモノリスとレイヤー構成）

> 版: v0.8（2026-10-11、コントローラの名前と URL の書き方を OpenAPI から決める）/ 対象: `api/`。バックエンドはオーナーが書く。この文書はオーナーと AI の相談で決めたことの記録。
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
│   ├── web/                     Web の共通の仕組み（Security・CORS・JSON の読み方・エラー処理・リクエストのログ）
│   └── persistence/             DB の共通の仕組み（接続・TransactionRunner の実装）
├── modules/
│   ├── player/
│   │   ├── api/                 外に約束する窓口（interface と外向けの型）だけ。domain を含まない。純粋な Kotlin
│   │   ├── core/                domain + application。api の窓口を実装する（純粋な Kotlin）
│   │   └── adapter/             web（コントローラ）+ persistence（リポジトリの実装）。Spring
│   ├── auth/                    他モジュールから使われないので api はない（core・adapter）
│   │   ├── core/
│   │   └── adapter/
│   ├── app/                     アプリのバージョン（`/app/version`）
│   └── character/ …             自分のマスタ（spec/master の自分の分）と、プレイヤーごとのデータを持つ
└── bootstrap/                   起動（KApplication）だけ
```

### モジュール（フェーズ 1）
| モジュール | 担当 | 状態 |
|---|---|---|
| `auth` | トークンの発行と照合。外に出すのは「トークン → PlayerId」 | 作成済み（`POST /auth/guest`） |
| `player` | プロフィール（名前・Lv・お札・出撃キャラ）。`/me` | 作成済み（出撃キャラの変更は character の後） |
| `app` | 必要なアプリの最低バージョン（`/app/version`。`settings.json` の `minAppVersion`） | 予定 |
| `character` | キャラのマスタ（`characters.json`）・所持キャラ・強化（育成の決まり `growth`）。`/me/characters` | 予定 |
| `item` | アイテムのマスタ（`items.json`）と所持数。`/me/items`。使う（減らす）・渡す（増やす）は `ItemApi` で受ける | 予定 |
| `quest` | クエストのマスタ（`quests.json`。敵のステータスと行動）・解放とクリア状況・報酬。`/me/quests` | 予定 |
| `battle` | バトルのエンジン（ゴールデンテスト）とバトルのセッション。`/quests/{id}/sessions`・`/quest-sessions/*`（docs/02 D-8） | 予定 |
| `weather` | 天気のマスタ（`weathers.json`）と日替わりの天気 | 予定 |
| `master` | （**なくす**）マスタをまとめて配信していた。D-8 で配信をやめ、マスタは各モジュールが持つことにしたので、`/master` を消すときに一緒に消す（§7） | 廃止予定 |

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
- **api は、他モジュールから使われるモジュールに作る。** auth を呼ぶのは `platform:web` の `TokenAuthenticator` だけなので、auth には api がない。他のモジュールのマスタが要るときは、その持ち主の api（例: battle → `CharacterApi`・`QuestApi`）に聞く。
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
    fun create(name: String): CreatePlayerResult

    fun find(id: PlayerId): PlayerSummary?
}

// player:core — 処理の本体（domain の型）
interface PlayerService {
    fun createPlayer(name: PlayerName): Player

    fun findPlayer(id: PlayerId): Player?
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
    override fun create(name: String): CreatePlayerResult {
        val playerName = PlayerName.of(name) ?: return CreatePlayerResult.InvalidName
        return CreatePlayerResult.Created(playerService.createPlayer(playerName).toSummary())
    }

    override fun find(id: PlayerId): PlayerSummary? = playerService.findPlayer(id)?.toSummary()
}
```

### メソッド名の付け方
Api・Service・Repository は似た形のメソッドが並ぶので、層ごとに付け方を決めて迷わないようにする。

**取る動詞は、取る数と「なかったときに何を返すか」で分ける。**

| 動詞 | 意味 | 戻り値 |
|---|---|---|
| `find` | 1 件。ないかもしれないものを取る | `T?` |
| `get` | 1 件。必ずあるものを取る（ないのはバグ） | `T`。なければ例外 |
| `list` | 複数 | `List<T>`（なければ空のリスト） |

- 「見つからない」が普通に起こるもの（ID で引くプレイヤー・キャラなど）は `find`。`get` は、起動時に読んだマスタのように、なければ設定やデータの誤りになるものにだけ使う。
- 複数は、どの層でも `list` にする（`findAll` は使わない）。動詞を見れば、1 件（`T?`）か複数（`List<T>`）かが分かるようにするため。`findAllBy〇〇` は Spring Data の付け方で、core の Repository（Spring に依存しない自前の interface）が合わせる理由はない。
- Repository の `list` には、引く条件を `By〇〇` で必ず付ける（`listByPlayerId`）。全部を取るときは `listAll()`。条件のない `list()` は「全部」と読み違えやすいので使わない。

**層ごとの付け方**

| 層 | 決まり | 例 |
|---|---|---|
| Repository（データの出し入れ） | 保存の言葉だけを使う（`findById`・`listBy〇〇`・`listAll`・`save`・`delete`）。リソース名は入れない（型の名前に入っている） | `PlayerRepository.findById(id)`・`OwnedCharacterRepository.listByPlayerId(playerId)`・`CharacterRepository.listAll()` |
| Service（処理の本体） | **動詞＋リソース名**。動詞はゲームの言葉（`rename`・`acquire` など。domain のエンティティの関数と揃える）。引数が自分の ID なら `ById` を付けない（型で分かる）。ID 以外で引くときだけ `By〇〇` を付ける | `createPlayer`・`findPlayer(id)`・`renamePlayer(id, name)`・`acquireCharacter(playerId, characterId)`・`listOwnedCharacters(playerId)` |
| Api（他モジュールへの窓口） | **動詞だけ**（`playerApi.find(id)` と読めば分かるので、リソース名は入れない）。失敗しうる操作は `<操作>Result` で返す | `PlayerApi.create(name)`・`PlayerApi.find(id)`・`CharacterApi.acquire(playerId, characterId)` → `AcquireCharacterResult` |

- Service だけリソース名を入れるのは、1 つの Service が複数のリソース（例: character のマスタと、持っているキャラ）を扱うことがあるから。Api は呼ぶ側が `characterApi.` と書くので、リソース名は重ねない。
- `update〇〇` のような汎用の動詞より、何を変えるかが分かるゲームの言葉を使う（`updatePlayerName` ではなく `renamePlayer`）。

### 入力の検証
- **Service は domain の型（検証済みの値）を受け取る。** 例: `createPlayer(name: PlayerName)`・`renamePlayer(id, name: PlayerName)`。不正な値は型の上で渡せないので、Service は「名前が不正なら？」を考えなくてよい。
- **外から来た値を domain の型にするのは入口の仕事。** HTTP からはコントローラ、他モジュールからは `Default<モジュール>Api` が `PlayerName.of(...)` を呼び、だめなら 400 や `InvalidName` を返す。ルール（1〜6 文字など）は domain の 1 か所にあり、入口はそれを呼ぶだけ。
- Service の失敗が「見つからない」だけなら `null` で返す（例: `renamePlayer(...): Player?`）。失敗の種類が 2 つ以上になったら `sealed interface` の結果の型にする。結果の型の名前に Web の言葉（`Me` など）を入れない。
- domain のエンティティを変える操作は、エンティティ自身の関数にする（例: `player.rename(name)` は `copy(name = name)` を返す）。companion には「まだないものを作る」関数（`Player.createGuest`）だけを置く。

### トランザクション
- core は Spring の `@Transactional` を使わない。`shared:kernel` の `TransactionRunner`（「この処理を 1 つのトランザクションで」）を受け取り、`platform:persistence` で実装する。
- メモリのリポジトリの間は、何もしない `TransactionRunner` を使う。

---

## 5. adapter と組み立て

- adapter の中はパッケージで `web`（コントローラ・リクエスト / レスポンスの型）と `persistence`（リポジトリの実装）に分ける。
- **各モジュールの組み立ては、そのモジュールの adapter の `@Configuration` で行う。** bootstrap は起動するだけ。
- 他モジュールの公開する窓口（例: `PlayerApi`）は Bean として受け取る。
- **core の組み立て関数は `import … as create<名前>` で別名を付けて呼ぶ。** Bean の関数と名前・引数が同じだと、クラスの中では Bean の関数自身が優先されて自分を呼び続ける（起動時に StackOverflowError）。

```kotlin
// player:adapter
import com.ficklewolf.k.player.application.playerApi as createPlayerApi
import com.ficklewolf.k.player.application.playerService as createPlayerService

@Configuration
class PlayerConfiguration {
    @Bean
    fun playerService(
        repository: PlayerRepository,
        transaction: TransactionRunner,
    ): PlayerService = createPlayerService(repository, transaction) // 自分の adapter（コントローラ）が使う

    @Bean
    fun playerApi(playerService: PlayerService): PlayerApi = createPlayerApi(playerService) // 他モジュールが使う
}
```

### コントローラ
名前は全部 OpenAPI（`spec/openapi/openapi.yaml`）から機械的に決める。spec にもう名前があるので、新しく考えない。

| 対象 | 決まり | 例 |
|---|---|---|
| メソッド名 | OpenAPI の **`operationId` と同じ** | `createGuest`・`getMe`・`updateMe`・`getAppVersion`・`listMyCharacters`・`startQuest` |
| リクエスト・レスポンスの型 | OpenAPI の **スキーマ名と同じ**。`〜Request` で終わるものはそのまま、それ以外は後ろに `Response` を付ける。入れ子の 1 件も同じ | `CreateGuestRequest`・`MeResponse`・`MyCharacterListResponse`・`MyCharacterResponse` |
| URL | クラスに `@RequestMapping` を付けず、**メソッドに OpenAPI のパスをそのまま全部書く** | `@GetMapping("/me/characters")`・`@PostMapping("/quest-sessions/{sessionId}/commands")` |
| クラス名 | **モジュールの名前（扱うリソース）+ `Controller`**。URL の形ではなく、データの持ち主で決める | `/me` → `PlayerController`（player）、`/me/characters` → `CharacterController`（character）、`/quests/{questId}/sessions`・`/quest-sessions/*` → `BattleController`（battle） |
| 戻り値の型 | 返すものが 1 種類なら型を書く（`ResponseEntity<AppVersionResponse>`）。エラー（Problem）も返すときだけ `ResponseEntity<*>` | `AppController` は前者、`PlayerController` は後者 |

- メソッド名を `operationId` に揃えるのは、web が OpenAPI から作る型・関数の名前の元にもなっているから。spec・web・api を同じ名前で grep できる。1 件は `get`、複数は `list` の使い分けも spec の側で済んでいる。
- URL を全部書くのは、ログに出たパスなどで探したときに、spec と同じ文字列でコントローラが見つかるようにするため（クラスとメソッドに分けると、つなげた形で探せない）。
- パスでは URL の文字列で探せるので、クラス名はパスに合わせず、どのモジュールのものかが分かる名前にする。1 つのモジュールが扱うリソースが増えて大きくなったら、そのとき `<リソース>Controller` に分ける。

```kotlin
@RestController
class CharacterController(
    private val characterService: CharacterService,
) {
    @GetMapping("/me/characters")
    fun listMyCharacters(
        @CurrentPlayer player: AuthenticatedPlayer,
    ): ResponseEntity<MyCharacterListResponse> {
        val characters = characterService.listOwnedCharacters(player.playerId)
        return ResponseEntity.ok(MyCharacterListResponse(characters.map { it.toResponse() }))
    }
}
```

### 認証
- `platform:web` に、Security の設定・トークンのフィルタ・`TokenAuthenticator`（インターフェース）・`AuthenticatedPlayer(playerId)`・`@CurrentPlayer` を置く。
- `auth:adapter` が `TokenAuthenticator` を実装する（`auth:core` の照合のユースケースを使う）。
- 各モジュールのコントローラは **`@CurrentPlayer player: AuthenticatedPlayer`** で受け取り、`player.playerId` だけを使う（auth も Spring Security も知らない）。
  - `@AuthenticationPrincipal` を直接使わない（モジュールが Spring Security に依存してしまう）。
  - 受け取る型は `AuthenticatedPlayer` にする。`PlayerId` などにすると、型が合わずに `null` が渡されて 500 になる。
- ログインなしで呼べる API は、各モジュールの `@Configuration` が `PublicEndpoint(method, path)` の Bean で登録する。`SecurityConfiguration` がそれを集めて許可する（platform は個々の API を知らない）。
- トークンは中身に意味のない乱数（32 バイト・Base64URL）。DB には SHA-256 のハッシュだけを保存する。

---

## 6. Web の共通の仕組み（platform:web）

### エラー
- エラーは RFC 9457（Problem Details）の形で返し、機械で見分けるための `code` を付ける（`spec/openapi` の `ErrorCode`。spec にない `code` を返さない）。
- 共通のコードは `CommonErrorCode`（`VALIDATION_FAILED`・`UNAUTHORIZED`・`INTERNAL_ERROR`）。モジュール固有のコード（`INVALID_NAME` など）は各 adapter が `problemResponse(...)` で返す。
- `GlobalExceptionHandler`: 本文が読めないとき（JSON が壊れている・型が違う・知らない項目がある）は 400 `VALIDATION_FAILED`。予期しない例外は 500 `INTERNAL_ERROR`（原因はログにだけ出し、レスポンスには出さない）。
- 401 は Security の `AuthenticationEntryPoint` が返す（コントローラより手前で弾くため）。
- 「トークンは正しいのにプレイヤーがいない」は 401 `UNAUTHORIZED` にする（web は登録画面に戻る）。

### JSON の読み方（厳しく読む）
spec の `additionalProperties: false` と型を守るため、Jackson の既定の「気を利かせた読み方」を切る。
- 知らない項目があれば 400（`application.properties` の `spring.jackson.deserialization.fail-on-unknown-properties=true`）。
- 文字列の項目に数字・小数・真偽値が来たら、文字列に変換せず 400（`JsonConfiguration` の `JsonMapperBuilderCustomizer`）。Jackson 3 では `ALLOW_COERCION_OF_SCALARS` を切っても数字 → 文字列は止まらないので、coercion config で `LogicalType.Textual` を `Fail` にする。
- PATCH で変える項目が 0 個なら、コントローラが 400 `VALIDATION_FAILED` を返す（spec の `minProperties: 1`）。

### リクエストのログ
- `RequestLoggingFilter` が API の入り（`request.in`）と出（`request.out`。status・durationMs）を構造化ログ（logstash 形式の JSON）で出す。
- レベルは status で決める（5xx: ERROR、4xx: WARN、それ以外: INFO）。CloudWatch などで絞り込めるよう、数値のレベル（`level_value`）も出る。
- リクエストごとに `requestId` を MDC に入れ、`X-Request-Id` ヘッダで返す（web から読めるよう CORS で公開する）。本文と `Authorization` はログに出さない。`/actuator` は出さない。

### CORS
- web（別のオリジン）から呼べるよう、`WebCorsConfiguration` でルールを作り、Security の `.cors { }` に渡す（プリフライトには `Authorization` が付かないので、認証より手前で答える必要がある）。
- 許可するオリジンは設定 `k.cors.allowed-origins`（本番は環境変数 `K_CORS_ALLOWED_ORIGINS`）。`*` にはしない。
- 許可するのは spec にあるメソッド（GET・POST・PATCH）と、web が送るヘッダ（`Authorization`・`Content-Type`）だけ。クッキーは使わないので `allowCredentials` は false のまま。

---

## 7. マスタ（各モジュールが自分の分を持つ）
D-8（docs/02）でマスタをまとめて配信するのをやめ、マスタを読むのは api の中のモジュールだけになった。そこで、**マスタはデータの持ち主のモジュールが持つ**。中央の master モジュールは作らない。

| spec/master | 持ち主 |
|---|---|
| `characters.json` | character |
| `quests.json`（敵のステータス・行動） | quest |
| `weathers.json` | weather |
| `items.json` | item（所持数も item が持つ。強化する character・報酬を渡す quest は `ItemApi` に頼む） |
| `attributes.json` | 相性はバトルのルール（battle）。名前・絵のキーは表示する側 |
| `settings.json` | 項目ごとに持ち主が違う。`minAppVersion` → app、`starterCharacterId`・`growth`（強化の上限・1 個あたりの上昇量）→ character、`rewards` → quest。各モジュールが自分の項目だけを読む |

- **正は `spec/master/*.json`。** 各モジュールの adapter が、ビルド時に `processResources` で**自分のファイルだけ**を jar に同梱し、起動時に 1 回だけ読む（ファイルがない・壊れているときは起動に失敗する）。リポジトリにはコピーを置かない。
- マスタの読み込みも port（`<対象>MasterRepository` など）にし、実装は adapter に置く。JSON を型に変えるのは adapter の仕事で、core は JSON を知らない。**DB ができたら**、デプロイ時に各モジュールが自分のテーブルへ投入し、差し替えるのは実装だけ。
- 他のモジュールのマスタやデータが要るときは、持ち主の api に聞く（例: battle はキャラの基礎ステータスを `CharacterApi`、敵を `QuestApi` から。character の強化は `ItemApi` でアイテムを減らしてから自分のステータスを上げる。quest の報酬は `ItemApi` でアイテムを渡す）。マスタを丸ごと渡さず、要る形で返す。
- `settings.json` は 1 つのファイルに持ち主の違う値が混ざっている。気になったら spec のファイルを分けることを相談する（spec の変更なのでオーナーが決める）。

### 今ある master モジュール（廃止予定）
- `GET /master`・`GET /master/version`・`MasterVersion`（ETag と 304 のためのバージョン計算）・`ClasspathMasterRepository` は、web が `/app/version` と画面ごとの API に移ったら**モジュールごと消す**。
- それまでは残す（今の web が起動時に使っているため）。

---

## 8. パッケージ

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

## 9. Gradle

- 共通設定は `build-logic` の convention plugin にまとめ、各モジュールの `build.gradle.kts` は plugin と依存だけを書く。プラグインのバージョンは `build-logic/build.gradle.kts` の 1 か所で管理する。

| plugin | 使う場所 | 中身 |
|---|---|---|
| `k.kotlin-core` | kernel・各 core | Kotlin（JVM）・Java 21・ktlint・JUnit |
| `k.spring-adapter` | 各 adapter・platform | `k.kotlin-core` ＋ `plugin.spring`・Spring Boot の BOM・`-Xjsr305=strict`。実行はしない |
| `k.spring-boot-app` | bootstrap | `k.spring-adapter` ＋ Spring Boot のプラグイン（実行可能な jar） |

- **jar 名はプロジェクトのパスから付ける**（例: `modules-player-core`）。`core`・`adapter` という同じ名前のモジュールが並ぶので、そのままだと実行可能な jar の中で衝突する。
- **依存は `api(...)` と `implementation(...)` を使い分ける。** 公開する関数・型の引数や戻り値に出てくる依存は `api`（使う側にも見える）、中だけで使うものは `implementation`。例: `platform:web` は Spring MVC・Security・kernel を `api` で公開しているので、各 adapter は `platform:web` だけを書けばよい（webmvc などを重ねて書かない）。
- **group もプロジェクトのパスから付ける**（例: `:modules:auth:core` → `com.ficklewolf.k.modules.auth`）。Gradle はモジュールを「group・名前・version」で見分けるので、group が同じだと `auth:core` から `player:core` への依存を自分自身への依存と取り違え、循環した依存のエラーになる（jar 名を変えても見分けには効かない）。

---

## 10. 決定事項

| 日付 | 内容 |
|---|---|
| 2026-10-04 | モジュラーモノリスにする。モジュールは `auth` と `player` から始める（認証とプロフィールを分ける） |
| 2026-10-04 | core（domain + application）は Spring に依存しない。トランザクションは `TransactionRunner` で表す |
| 2026-10-04 | 各モジュールを **core と adapter** の 2 つの Gradle モジュールに分け、横断的な仕組みは `platform` に置く |
| 2026-10-04 | 他モジュールへの窓口は `<モジュール>Api`（interface。api に置く）、実装は `Default<モジュール>Api`（`internal`。core に置く）、組み立て関数は `<モジュール>Api(...)`。`Service` は core の中の処理（ユースケース）の名前と紛れ、Spring の `@Service` とも紛れるので使わない |
| 2026-10-04 | 各モジュールに **api（契約）** を足し、api・core・adapter の 3 つにする。他モジュールへの依存は相手の api だけ。api は domain の型を出さず、外向けの型で約束する（モジュラーモノリスの標準の形） |
| 2026-10-04 | core の入口を 2 つにする。処理の本体は `<モジュール>Service`（domain の型。自分の adapter が使う）、他モジュール向けは `Default<モジュール>Api`（変換だけ）。core の中で api の型を知るのは変換役だけ |
| 2026-10-08 | Service は domain の型（検証済みの値）を受け取り、外の値の検証は入口（コントローラ・`Default<モジュール>Api`）で行う |
| 2026-10-08 | コントローラは `@CurrentPlayer player: AuthenticatedPlayer` で今のプレイヤーを受け取る。`/me` は player モジュールが担当する（中身が player のデータだから） |
| 2026-10-08 | リクエストの JSON は厳しく読む（知らない項目・数字や真偽値から文字列への変換は 400 `VALIDATION_FAILED`） |
| 2026-10-08 | CORS は `platform:web` で Security に組み込み、許可するオリジンは設定で決める |
| 2026-10-08 | master は api・core・adapter の 3 つ。DB ができるまでは spec/master をビルド時に jar へ同梱し、起動時に読んで JSON のまま配信する（→ 2026-10-10 に変更） |
| 2026-10-10 | **マスタは持ち主のモジュールが持つ**（character・item・quest・weather・app など。§7）。item はアイテムのマスタと所持数を持つ別のモジュールにし、強化・報酬は `ItemApi` を通す。中央の master モジュールは作らず、今あるものは `/master` を消すときに一緒に消す。他のモジュールのマスタは持ち主の api に聞く |
| 2026-10-10 | メソッド名の決まり: `find` はないかもしれないもの（`T?`）、`get` は必ずあるもの（ないのはバグ）。Repository は保存の言葉（`findById`・`save`）、Service は動詞＋リソース名（`findPlayer`・`renamePlayer`）、Api は動詞だけ（`PlayerApi.find`・`create`）（§4「メソッド名の付け方」） |
| 2026-10-10 | 複数を取るメソッドは、どの層でも `list` にする（Repository は `listBy〇〇`・`listAll`、Service は `list〇〇s`）。`findAll` は使わない。`find` は 1 件（`T?`）だけ |
| 2026-10-11 | コントローラの名前は OpenAPI から決める: メソッド名は `operationId`、リクエスト・レスポンスの型はスキーマ名（`〜Request` 以外は `Response` を付ける）、URL はクラスに分けずメソッドに全部書く、クラス名はモジュールの名前 + `Controller`、戻り値は 1 種類なら型を書く（§5「コントローラ」） |

### 不採用にした案
- **外側（presentation・infrastructure）を全モジュールで共通にする**: Gradle のモジュールは少なく済むが、外側では境界をコンパイラで守れない（特に DB で他モジュールのテーブルを触れてしまう）。モジュール数はほぼ変わらないので、境界を守れる core + adapter にした。
- **domain と application を別の Gradle モジュールにする**: core の中のパッケージと `internal` で十分に分けられる。
- **他モジュールの core に直接依存する**: 相手の domain・ports まで見えてしまい、domain の変更が他モジュールに広がる。api（契約）を挟む形にした。
- **使う側がインターフェースを持つ（依存性の逆転）**: 使う側ごとにつなぎ役のクラスが要る。モジュラーモノリスの標準である api（契約）の形にした。
- **マスタを中央の master モジュールで持ち、`MasterApi` で各モジュールに配る**（2026-10-10）: みんなが master に依存して何でも知っているモジュールになり、クエストの形を変えるだけでも影響が広がる。「キャラの基礎ステータスは誰のものか」もあいまいになり、DB にしたときの「テーブルはモジュールの持ち物」とも合わない。
- **master の JSON を起動時にフォルダから読む**: 再ビルドは要らないが、デプロイ時に jar と一緒に JSON を置く必要がある。jar だけで動くよう、ビルド時に同梱する形にした。
- **master の中身を Kotlin の型にして返す**: 配信するだけなら型にする利点がなく、spec のスキーマと二重に管理することになる。
- **`/players/me` にする**: 他のプレイヤーを `/players/{id}` で見る予定がない。URL にモジュールの分け方を出さない。
- **アーキテクチャのテスト（Konsist など）**: 境界のほとんどは Gradle の依存で守れるので、必要になったら入れる。
