import { http, HttpResponse } from "msw";
import * as v from "valibot";

import { API_BASE_URL } from "@/api/core/config";
import { authenticate, problem, readJson } from "@/api/mocks/db";
import type { MockDb, MockPlayer } from "@/api/mocks/db";
import { normalizePlayerName } from "@/domain/player/name";

const HTTP_BAD_REQUEST = 400;
const HTTP_UNAUTHORIZED = 401;

const UpdateMeSchema = v.strictObject({
  name: v.optional(v.string()),
  selectedCharacterId: v.optional(v.string())
});

/** `GET /me`・`PATCH /me` のモック */
export const createMeMockHandlers = (db: MockDb) => [
  http.get(`${API_BASE_URL}/me`, ({ request }) => {
    const me = authenticate(db, request);
    if (me === null) return problem(HTTP_UNAUTHORIZED, "UNAUTHORIZED");
    return HttpResponse.json(me);
  }),

  http.patch(`${API_BASE_URL}/me`, async ({ request }) => {
    const me = authenticate(db, request);
    if (me === null) return problem(HTTP_UNAUTHORIZED, "UNAUTHORIZED");

    const body = v.safeParse(UpdateMeSchema, await readJson(request));
    if (!body.success || Object.keys(body.output).length === 0) return problem(HTTP_BAD_REQUEST, "VALIDATION_FAILED");

    const name = body.output.name === undefined ? null : normalizePlayerName(body.output.name);
    if (name !== null && !name.ok) return problem(HTTP_BAD_REQUEST, "INVALID_NAME");

    const selectedCharacterId = body.output.selectedCharacterId ?? me.selectedCharacterId;
    if (db.ownedCharacterIds.get(me.id)?.has(selectedCharacterId) !== true) {
      return problem(HTTP_BAD_REQUEST, "CHARACTER_NOT_OWNED");
    }

    const updated: MockPlayer = { ...me, name: name?.name ?? me.name, selectedCharacterId };
    db.players.set(me.id, updated);
    return HttpResponse.json(updated);
  })
];
