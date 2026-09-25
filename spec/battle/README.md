# バトルのゴールデンテスト

> 版: v0.3（ケース 13 件・細かいルールを追加。v0.2 の計算ルールはオーナー確定済み）
> ルールの出典: `docs/01_legacy-analysis.md` §2（旧作ソースからの逆算）

クエストバトル 1 戦分の「入力（キャラ・敵・乱数のシード・コマンドの並び）」と「期待する結果」を JSON で書く。web（TS）と api（Kotlin）の両方が、`cases/` の全ケースを通すこと。

## ファイル
| パス | 内容 |
|---|---|
| `case.schema.json` | ケースファイルの形（JSON Schema） |
| `cases/*.json` | テストケース。ファイル名は `3 桁の番号-内容.json` |
| `rng/mulberry32.json` | 乱数の実装を確かめるテストベクタ |

## ケースの形
```jsonc
{
  "name": "…",
  "description": "…",
  "seed": 1,
  "player": { "hp": 1400, "attack": 400, "defence": 90, "attribute": "yang", ... },
  "enemies": [
    { "hp": 3100, "attack": 630, "defence": 40, "attribute": "yang", "turns": ["attack", "defend", ...], ... }
  ],
  "steps": [
    { "command": { "type": "attack" }, "expect": { "turn": 2, "playerHp": 860, "enemyHp": 2740 } }
  ]
}
```
- 数値はマスタを参照せず、ケースの中に直接書く（マスタが変わってもケースが壊れないように）。
- `enemies` は 1 体以上。2 体以上なら連戦（計算のルール 8）。形は `spec/master` のクエストの `stages[].battle` と同じ。
- `expect` に書いた項目だけを比べる（書いていない項目は比べない）。
- 実行できないコマンドは `expect.rejected` に理由コードを書く。そのとき状態は変わらない。

### expect に書ける項目
| 項目 | 意味 |
|---|---|
| `stage` | 何体目の敵か（1 始まり） |
| `turn` | これから行うターンの番号（1 始まり） |
| `playerHp` / `enemyHp` | HP |
| `enemyMaxHp` | 敵の最大 HP（超回復で上がる） |
| `enemyAttribute` | 敵の今の属性（属性変化で変わる） |
| `outcome` | `ongoing` / `win` / `lose` |
| `checkpoints` | チェックポイントのターン番号の並び |
| `numbnessTurns` | ビリビリの残りターン数 |
| `paralyzed` | このコマンドがしびれて失敗したか |
| `rejected` | 実行できなかった理由コード |

## 用語とコード上の名前
| 旧作 | コマンド / 敵の行動 |
|---|---|
| 攻撃 / 防御 / 攻撃バフ / 防御バフ | `attack` / `defend` / `attackBuff` / `defenceBuff` |
| チェック / リターン / 必殺技 | `check` / `rewind` / `special` |
| 固定攻撃 / 強攻撃 / 集中 / 必殺技（敵） | `fixedAttack` / `strongAttack` / `concentration` / `deathblow` |
| 挑発 / 全回復 / 超回復 / 属性変化 | `provocation` / `fullRecovery` / `rateRecovery` / `changeAttribute` |
| ビリビリ / 攻撃デバフ / 防御デバフ | `numbness` / `attackDebuff` / `defenceDebuff` |
| 陽 / 音 / 月 | `yang` / `note` / `moon` |

## 計算のルール（実装がずれないように固定する）

### 全体
1. **ターン**: `turn` はこれから行うターンの番号（1 始まり）。行動系のコマンド（`attack` / `defend` / `attackBuff` / `defenceBuff`）で 1 進む。`check` / `rewind` / `special` はターンを消費しない。
2. **1 ターンの順番**: ① ビリビリの判定 → ② 先制コマンド（`defend` / `defenceBuff`）→ ③ 敵の行動 → ④ 決着の判定（プレイヤー）→ ⑤ プレイヤーの行動（`attack` / `attackBuff`）→ ⑥ 決着の判定（敵）→ ⑦ ターンを進める。
3. **決着**: ③でプレイヤーの HP が 0 になったら負け（⑤は行わない）。⑤で敵の HP が 0 になったら、次の敵がいれば連戦（ルール 8）、いなければ勝ち。決着後のコマンドは `BATTLE_FINISHED`。
4. **数値**: 計算は倍精度浮動小数（IEEE 754 double）で下の式の順番どおりに行う。**HP に反映するダメージ・回復量は小数点以下を切り捨てた整数**にする。ダメージは 0 未満にしない。HP は 0 未満にならない。
5. **属性**: 陽 > 音 > 月 > 陽。有利な側は自分の攻撃力 ×1.25、相手の攻撃力 ×0.75（不利な側はその逆）。同じ属性は ×1。

### プレイヤーの値
- 攻撃力 = `attack` × 属性の倍率。攻撃倍率は 1 から始まり、攻撃バフで `attackBuffRate` を足す。
- 防御力 = `defence` ＋ 防御バフの回数 × `defenceBuffAmount`。

### プレイヤーの行動
| コマンド | 効果 |
|---|---|
| `attack`（⑤） | 敵に `攻撃力 × 攻撃倍率 − 敵の今の防御力` のダメージ |
| `attackBuff`（⑤） | 攻撃倍率 += `attackBuffRate` |
| `defend`（②） | このターンに受ける `attack` / `strongAttack` のダメージを `その攻撃力 × 0.2 − 防御力` にする |
| `defenceBuff`（②） | 防御バフの回数 +1（このターンの敵の攻撃から効く） |

### 敵の値と行動（③）
- 敵の攻撃力 = `attack` × 属性の倍率 ＋ 挑発の上乗せ。敵の攻撃倍率は 1 から始まる。
- 敵の防御力は `defence` から始まり、防御バフで増える。`defend` した直後のターンだけ一時的に変わり、次の敵の行動の前に元に戻る。

| 行動 | 効果 |
|---|---|
| `attack` | `敵の攻撃力 × 敵の攻撃倍率 − プレイヤーの防御力` のダメージ（`defend` 中は上の式） |
| `strongAttack` | `strongAttackPower − プレイヤーの防御力` のダメージ（`defend` 中は `strongAttackPower × 0.2 − 防御力`） |
| `fixedAttack` | `fixedAttackPower` のダメージ（防御は効かない） |
| `deathblow` | `敵の攻撃力 × 敵の攻撃倍率 × 100` のダメージ（防御は効かない） |
| `defend` | `プレイヤーの攻撃力 × 攻撃倍率` が敵の防御力より大きければ、このターンの敵の防御力を `その値 × 0.8` にする |
| `attackBuff` | 敵の攻撃倍率 += `attackBuffRate` |
| `defenceBuff` | 敵の防御力 += `defenceBuffAmount`（ずっと続く） |
| `concentration` | 何もしない |
| `provocation` | 敵の攻撃力の上乗せ +10 |
| `fullRecovery` | 敵の HP を最大 HP まで回復 |
| `rateRecovery` | 敵の HP += `最大 HP × recoveryRate`（切り捨て）。最大 HP を超えたら、最大 HP もその値にする |
| `changeAttribute` | 敵の属性を「元の属性 ⇔ `changeAttribute`」で切り替える。属性の倍率を計算し直し、**挑発の上乗せは 0 に戻る**（旧作どおり） |
| `numbness` | プレイヤーがビリビリ耐性でなければ、ビリビリの残りを 3 にする |
| `attackDebuff` | プレイヤーの攻撃倍率 −= `attackDebuff`（0 未満にはしない） |
| `defenceDebuff` | プレイヤーの防御バフの回数 −= `defenceDebuff`。防御力が 0 以下になるなら、防御力がちょうど 0 になる回数（`-defence / defenceBuffAmount`）にする |

### ビリビリ（①）
6. 残りが 1 以上のとき、行動系のコマンドのたびに残りを 1 減らして乱数を 1 回引く。`値 / 2^32 < 0.5` ならしびれて、そのターンのプレイヤーの行動（②⑤）は行わない（敵の行動は行う）。
7. 乱数は mulberry32（シードは 32 bit 整数）。上の場面以外では乱数を引かない。ビリビリの残りはリターンでも戻らない。

### 連戦
8. 敵の HP が 0 になり次の敵がいるときは、次の敵に入れ替えて `turn` を 1 に戻す。プレイヤーの HP・攻撃倍率・防御バフ・ビリビリの残り・リターンと必殺技の使用回数は引き継ぐ。敵の値・チェックポイント・チェックの回数はリセットする。

### チェック・リターン・必殺技
9. **チェック**: 今のターンをチェックポイントにする。1 ターン目・同じターン・`checkMax` 回を超えるときはできない。
10. **リターン**: `to` のチェックポイントのターンに戻る。**戻すのはターン番号と敵の行動の位置だけ**で、HP・バフ・デバフ・属性・ビリビリは戻さない。戻ったらチェックポイントとチェックの回数はリセット。`rewindMax` 回まで。チェックポイントが今のターンだけのとき、`to` がチェックポイントでないとき・今のターンのときはできない。
11. **必殺技**: 条件（HP が最大 HP の半分未満・リターン 1 回以上・`2 < turn < 敵の行動の数 − 2`・`specialMax` 回未満）を満たすとき、`turn − 2` 〜 `turn + 2` の範囲の 1 ターンの敵の行動を `action` に書き換える。書き換えはリターンしても残る。

## 実行できないコマンドの理由コード
複数に当てはまるときは、**表の上から順に判定して最初に当てはまったもの**を返す。

| コード | 対象 | 条件 |
|---|---|---|
| `BATTLE_FINISHED` | すべて | 決着がついている |
| `CANNOT_CHECK_FIRST_TURN` | `check` | 1 ターン目 |
| `ALREADY_CHECKED` | `check` | このターンはもうチェックしている |
| `CHECK_LIMIT` | `check` | チェックの回数を使い切っている |
| `NO_CHECKPOINT` | `rewind` | チェックポイントが無い |
| `REWIND_LIMIT` | `rewind` | リターンの回数を使い切っている |
| `CANNOT_REWIND_HERE` | `rewind` | チェックポイントが今のターンだけ |
| `INVALID_REWIND_TARGET` | `rewind` | `to` がチェックポイントではない、または今のターン |
| `SPECIAL_UNAVAILABLE` | `special` | 必殺技の条件を満たしていない（回数を使い切った場合も含む） |
| `INVALID_SPECIAL_TARGET` | `special` | 書き換えるターンが `turn − 2` 〜 `turn + 2` の範囲外、または存在しないターン |

## 決定事項
- 丸め: 計算は倍精度のまま、HP に反映するダメージ・回復量だけ切り捨て（計算のルール 5）。
- 必殺技: `{ "type": "special", "turn": 書き換えるターン番号, "action": 書き換え後の行動 }` で指定する。
- 旧作のバグ（防御デバフが攻撃デバフの値を使う）は直した値でケースを書く（`docs/02` §4）。
