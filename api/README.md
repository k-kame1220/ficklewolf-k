# K API

K のバックエンド API。

- アプリ名: K
- 作者: FickleWolf
- パッケージ: `com.ficklewolf.k`
- 技術: Kotlin / Spring Boot / MySQL

## 構成

| モジュール | 役割 |
|---|---|
| `domain` | ドメインモデル |
| `application` | ユースケース |
| `infrastructure` | DB などの外部接続 |
| `presentation` | Web API（コントローラ） |
| `bootstrap` | 起動（`KApplication`） |

## 起動

```bash
cp .env.example .env
make up
make dev
```

1. `.env` の `MYSQL_ROOT_PASSWORD` を設定する（`.env` はコミットしない）。
2. `make up` で MySQL（コンテナ `k-mysql`、DB `k`）を起動する。
3. `make dev` で API を起動する。

## ヘルスチェック

`GET /actuator/health`（Spring Boot Actuator）

```bash
curl localhost:8080/actuator/health
```
