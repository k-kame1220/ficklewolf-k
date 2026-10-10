import { http, HttpResponse } from "msw";
import * as v from "valibot";

import { API_BASE_URL } from "@/api/core/config";
import type { components } from "@/api/generated/schema";
import { authenticate, problem } from "@/api/mocks/db";
import type { MockDb } from "@/api/mocks/db";
import { ATTRIBUTES } from "@/domain/attribute/attribute";

const charactersRaw =
  Object.values(
    import.meta.glob<string>("../../../../spec/master/characters.json", {
      eager: true,
      query: "?raw",
      import: "default"
    })
  )[0] ?? "null";

const HTTP_UNAUTHORIZED = 401;

const MasterCharactersSchema = v.array(
  v.object({
    id: v.string(),
    name: v.string(),
    attribute: v.picklist(ATTRIBUTES),
    description: v.string(),
    assets: v.object({ main: v.string(), icon: v.string(), home: v.string() })
  })
);

/** `GET /me/characters` のモック。持っているキャラだけを spec/master/characters.json から返す */
export const createCharacterMockHandlers = (db: MockDb) => {
  const characters = v.parse(MasterCharactersSchema, JSON.parse(charactersRaw));
  return [
    http.get(`${API_BASE_URL}/me/characters`, ({ request }) => {
      const me = authenticate(db, request);
      if (me === null) return problem(HTTP_UNAUTHORIZED, "UNAUTHORIZED");
      const owned = db.ownedCharacterIds.get(me.id) ?? new Set<string>();
      return HttpResponse.json({
        characters: characters
          .filter(character => owned.has(character.id))
          .map(character => ({
            id: character.id,
            name: character.name,
            attribute: character.attribute,
            description: character.description,
            assets: character.assets
          }))
      } satisfies components["schemas"]["MyCharacterList"]);
    })
  ];
};
