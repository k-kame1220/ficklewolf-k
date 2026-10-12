# K API

K のバックエンド API。設計は `../docs/05_backend-architecture.md`、API の定義は `../spec/openapi/openapi.yaml`。

- アプリ名: K
- 作者: FickleWolf
- パッケージ: `com.ficklewolf.k`
- 技術: Kotlin / Spring Boot（モジュラーモノリス）。DB は MySQL の予定（今はデータをメモリに持つ）

## 構成

```
api/
├── bootstrap/               起動（KApplication）と設定（application.properties）
├── build-logic/             Gradle の共通設定（k.kotlin-core・k.spring-adapter・k.spring-boot-app）
├── shared/kernel/           全モジュールで共有する小さな型（PlayerId・CharacterId・Attribute・TransactionRunner など）
├── platform/
│   ├── web/                 Web の共通の仕組み（エラー・JSON の読み方・認証・CORS・リクエストのログ）
│   └── persistence/         永続化の共通の仕組み（TransactionRunner の実装）
├── modules/<名前>/
│   ├── api/                 他モジュールへの窓口（<名前>Api と外向けの型）。他モジュールから使われるときだけ作る
│   ├── core/                domain（ルール）と application（Service・ports・Default<名前>Api）。Spring に依存しない
│   └── adapter/             web（コントローラ）と persistence（リポジトリの実装）と組み立て（@Configuration）
└── scripts/new-module.sh    モジュールのひな形を作る
```

| モジュール | 担当 | API |
|---|---|---|
| `auth` | ゲストアカウントの作成・トークンの発行と照合 | `POST /auth/guest` |
| `player` | プロフィール（名前・Lv・お札・出撃キャラ） | `GET /me`・`PATCH /me` |
| `app` | 必要なアプリの最低バージョン | `GET /app/version` |
| `character` | キャラのマスタ・所持キャラ | `GET /me/characters` |
| `weather` | 天気のマスタと今日の天気（日本時間の日付ごとに抽選） | `GET /weather/today` |

予定: item → quest（`/me/quests`）→ battle（エンジンとバトルの API）→ DB。モジュールの決まり・名前の付け方は docs/05 §4・§5。

## 起動

```bash
make dev
```

- `./gradlew bootstrap:bootRun` と同じ。http://localhost:8080 で起動する。
- マスタ（`../spec/master/*.json`）は、ビルド時に各モジュールが自分の分を jar に同梱する。
- データはメモリに持つので、**再起動すると消える**（アカウント・所持キャラ・今日の天気）。
- web から呼べるオリジンは `k.cors.allowed-origins`（既定は `http://localhost:4100`）。

### MySQL（DB を使い始めたら）

```bash
cp .env.example .env
make up
```

1. `.env` の `MYSQL_ROOT_PASSWORD` を設定する（`.env` はコミットしない）。
2. `make up` で MySQL（コンテナ `k-mysql`、DB `k`）を起動する。`make down` で止める。

## よく使うコマンド

| コマンド | 内容 |
|---|---|
| `./gradlew build` | ktlint・テスト・ビルド。CI と同じように前のビルド結果を使わずに確かめるときは `./gradlew clean build` |
| `./gradlew ktlintFormat` | ktlint の整形 |
| `scripts/new-module.sh <名前> [--with-api]` | モジュール（core・adapter。`--with-api` なら api も）を作り、bootstrap に adapter を足す。`settings.gradle.kts` は `modules/*/` を自動で読み込む |

## ヘルスチェック

`GET /actuator/health`（Spring Boot Actuator）

```bash
curl localhost:8080/actuator/health
```
