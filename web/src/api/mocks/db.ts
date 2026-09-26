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
};

/** 空のモックの DB を作る */
export const createMockDb = (): MockDb => ({
  players: new Map(),
  playerIdByToken: new Map(),
  ownedCharacterIds: new Map()
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
