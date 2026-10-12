import { HttpResponse } from "msw";

import type { ErrorCode } from "@/api/core/apiError";
import type { components } from "@/api/generated/schema";

const BEARER_PREFIX = "Bearer ";

/** モックの中のプレイヤー（api の `Me` と同じ形） */
export type MockPlayer = components["schemas"]["Me"];

/** モックの DB。ハンドラをまたいで共有し、`createMockHandlers` を呼ぶたびに空で作り直す */
export type MockDb = {
  readonly players: Map<string, MockPlayer>;
  readonly playerIdByToken: Map<string, string>;
  readonly ownedCharacterIds: Map<string, ReadonlySet<string>>;
  /** プレイヤーごとの、一度でもクリアしたクエストの ID */
  readonly clearedQuestIds: Map<string, ReadonlySet<string>>;
  /** 今日の天気の ID（モックでは固定） */
  readonly todayWeatherId: string;
  /** プレイヤーごとの、最後に始めたバトル（`battle.mock.ts` の簡易モック。決着したものも残す） */
  readonly battles: Map<string, MockBattle>;
};

/** モックのバトル。`battle` は api の形、それ以外は画面に出さない中の値 */
export type MockBattle = {
  readonly battle: components["schemas"]["Battle"];
  /** ステージごとの敵（行動の並びとステータス） */
  readonly stages: readonly MockBattleStage[];
  /** プレイヤーの基礎の値（`characters.json` の `base`） */
  readonly playerBase: { readonly attackBuffRate: number; readonly defenceBuffAmount: number };
  /** 敵の今の防御力 */
  readonly enemyDefence: number;
};

/** モックのバトルの敵 1 体 */
export type MockBattleStage = {
  readonly name: string;
  readonly imageKey: string;
  readonly attribute: components["schemas"]["Attribute"];
  readonly hp: number;
  readonly attack: number;
  readonly defence: number;
  readonly defenceBuffAmount: number;
  readonly strongAttackPower: number;
  readonly fixedAttackPower: number;
  readonly revealCount: number;
  readonly turns: readonly components["schemas"]["EnemyAction"][];
};

const MOCK_TODAY_WEATHER_ID = "rain";

/** 空のモックの DB を作る */
export const createMockDb = (): MockDb => ({
  players: new Map(),
  playerIdByToken: new Map(),
  ownedCharacterIds: new Map(),
  clearedQuestIds: new Map(),
  todayWeatherId: MOCK_TODAY_WEATHER_ID,
  battles: new Map()
});

/** `Authorization: Bearer` のトークンからプレイヤーを探す。無効なら null */
export const authenticate = (db: MockDb, request: Request): MockPlayer | null => {
  const header = request.headers.get("Authorization");
  if (header?.startsWith(BEARER_PREFIX) !== true) return null;
  const playerId = db.playerIdByToken.get(header.slice(BEARER_PREFIX.length));
  if (playerId === undefined) return null;
  return db.players.get(playerId) ?? null;
};

/** Problem Details のエラーを返す */
export const problem = (status: number, code: ErrorCode) =>
  HttpResponse.json({ type: "about:blank", title: code, status, code } satisfies components["schemas"]["Problem"], {
    status,
    headers: { "Content-Type": "application/problem+json" }
  });

/** リクエストの本文を JSON として読む。読めなければ null */
export const readJson = async (request: Request): Promise<unknown> => {
  try {
    const body: unknown = await request.json();
    return body;
  } catch {
    return null;
  }
};
