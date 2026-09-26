import { http, HttpResponse } from "msw";
import * as v from "valibot";

import { normalizePlayerName } from "@/domain/player/name";

import { API_BASE_URL } from "../config";

import type { ErrorCode } from "../apiError";
import type { components } from "../generated/schema";

type Me = components["schemas"]["Me"];

const STARTER_CHARACTER_ID = "zero";
const FIRST_LEVEL = 1;
const BEARER_PREFIX = "Bearer ";
const HTTP_CREATED = 201;
const HTTP_BAD_REQUEST = 400;
const HTTP_UNAUTHORIZED = 401;

const CreateGuestSchema = v.strictObject({ name: v.string() });
const UpdateMeSchema = v.strictObject({
  name: v.optional(v.string()),
  selectedCharacterId: v.optional(v.string())
});

const problem = (status: number, code: ErrorCode) =>
  HttpResponse.json({ type: "about:blank", title: code, status, code } satisfies components["schemas"]["Problem"], {
    status,
    headers: { "Content-Type": "application/problem+json" }
  });

const readJson = async (request: Request): Promise<unknown> => {
  try {
    const body: unknown = await request.json();
    return body;
  } catch {
    return null;
  }
};

/**
 * spec/openapi どおりに振る舞う MSW のハンドラを作る。プレイヤーとトークンはメモリに持ち、呼ぶたびに空の状態から始まる。
 */
export const createMockHandlers = () => {
  const players = new Map<string, Me>();
  const playerIdByToken = new Map<string, string>();
  const ownedCharacterIds = new Map<string, ReadonlySet<string>>();

  const authenticate = (request: Request): Me | null => {
    const header = request.headers.get("Authorization");
    if (header?.startsWith(BEARER_PREFIX) !== true) return null;
    const playerId = playerIdByToken.get(header.slice(BEARER_PREFIX.length));
    if (playerId === undefined) return null;
    return players.get(playerId) ?? null;
  };

  return [
    http.post(`${API_BASE_URL}/auth/guest`, async ({ request }) => {
      const body = v.safeParse(CreateGuestSchema, await readJson(request));
      if (!body.success) return problem(HTTP_BAD_REQUEST, "VALIDATION_FAILED");
      const name = normalizePlayerName(body.output.name);
      if (!name.ok) return problem(HTTP_BAD_REQUEST, "INVALID_NAME");

      const me: Me = {
        id: crypto.randomUUID(),
        name: name.name,
        level: FIRST_LEVEL,
        fuda: 0,
        selectedCharacterId: STARTER_CHARACTER_ID
      };
      const token = crypto.randomUUID();
      players.set(me.id, me);
      playerIdByToken.set(token, me.id);
      ownedCharacterIds.set(me.id, new Set([STARTER_CHARACTER_ID]));

      return HttpResponse.json({ token, me } satisfies components["schemas"]["CreateGuestResponse"], {
        status: HTTP_CREATED
      });
    }),

    http.get(`${API_BASE_URL}/me`, ({ request }) => {
      const me = authenticate(request);
      if (me === null) return problem(HTTP_UNAUTHORIZED, "UNAUTHORIZED");
      return HttpResponse.json(me);
    }),

    http.patch(`${API_BASE_URL}/me`, async ({ request }) => {
      const me = authenticate(request);
      if (me === null) return problem(HTTP_UNAUTHORIZED, "UNAUTHORIZED");

      const body = v.safeParse(UpdateMeSchema, await readJson(request));
      if (!body.success || Object.keys(body.output).length === 0) return problem(HTTP_BAD_REQUEST, "VALIDATION_FAILED");

      const name = body.output.name === undefined ? null : normalizePlayerName(body.output.name);
      if (name !== null && !name.ok) return problem(HTTP_BAD_REQUEST, "INVALID_NAME");

      const selectedCharacterId = body.output.selectedCharacterId ?? me.selectedCharacterId;
      if (ownedCharacterIds.get(me.id)?.has(selectedCharacterId) !== true) {
        return problem(HTTP_BAD_REQUEST, "CHARACTER_NOT_OWNED");
      }

      const updated: Me = { ...me, name: name?.name ?? me.name, selectedCharacterId };
      players.set(me.id, updated);
      return HttpResponse.json(updated);
    })
  ];
};
