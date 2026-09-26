import { http, HttpResponse } from "msw";
import * as v from "valibot";

import { API_BASE_URL } from "@/api/core/config";
import type { components } from "@/api/generated/schema";
import { problem, readJson } from "@/api/mocks/db";
import type { MockDb, MockPlayer } from "@/api/mocks/db";
import { normalizePlayerName } from "@/domain/player/name";

const STARTER_CHARACTER_ID = "zero";
const FIRST_LEVEL = 1;
const HTTP_CREATED = 201;
const HTTP_BAD_REQUEST = 400;

const CreateGuestSchema = v.strictObject({ name: v.string() });

/** `POST /auth/guest` のモック */
export const createAuthMockHandlers = (db: MockDb) => [
  http.post(`${API_BASE_URL}/auth/guest`, async ({ request }) => {
    const body = v.safeParse(CreateGuestSchema, await readJson(request));
    if (!body.success) return problem(HTTP_BAD_REQUEST, "VALIDATION_FAILED");
    const name = normalizePlayerName(body.output.name);
    if (!name.ok) return problem(HTTP_BAD_REQUEST, "INVALID_NAME");

    const me: MockPlayer = {
      id: crypto.randomUUID(),
      name: name.name,
      level: FIRST_LEVEL,
      fuda: 0,
      selectedCharacterId: STARTER_CHARACTER_ID
    };
    const token = crypto.randomUUID();
    db.players.set(me.id, me);
    db.playerIdByToken.set(token, me.id);
    db.ownedCharacterIds.set(me.id, new Set([STARTER_CHARACTER_ID]));

    return HttpResponse.json({ token, me } satisfies components["schemas"]["CreateGuestResponse"], {
      status: HTTP_CREATED
    });
  })
];
