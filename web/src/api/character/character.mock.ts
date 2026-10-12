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
const weathersRaw =
  Object.values(
    import.meta.glob<string>("../../../../spec/master/weathers.json", { eager: true, query: "?raw", import: "default" })
  )[0] ?? "null";
const settingsRaw =
  Object.values(
    import.meta.glob<string>("../../../../spec/master/settings.json", { eager: true, query: "?raw", import: "default" })
  )[0] ?? "null";

const HTTP_UNAUTHORIZED = 401;

const StatsSchema = v.object({ hp: v.number(), attack: v.number(), defence: v.number() });

const MasterCharactersSchema = v.array(
  v.object({
    id: v.string(),
    name: v.string(),
    attribute: v.picklist(ATTRIBUTES),
    description: v.string(),
    assets: v.object({ main: v.string(), icon: v.string(), home: v.string() }),
    base: StatsSchema
  })
);
const MasterWeathersSchema = v.array(
  v.object({ id: v.string(), attribute: v.picklist(ATTRIBUTES), bonus: StatsSchema })
);
const SettingsSchema = v.object({ growth: v.object({ itemUseMax: StatsSchema }) });

const stat = (base: number, weather: number): components["schemas"]["StatBreakdown"] => ({
  base,
  bonus: { item: 0, duplicate: 0, weather },
  total: base + weather
});

/**
 * `GET /me/characters` のモック。持っているキャラだけを spec/master/characters.json から返す。
 * ステータスは基礎の値と今日の天気のボーナスだけ（強化・被りはまだモックしない）
 */
export const createCharacterMockHandlers = (db: MockDb) => {
  const characters = v.parse(MasterCharactersSchema, JSON.parse(charactersRaw));
  const weathers = new Map(
    v.parse(MasterWeathersSchema, JSON.parse(weathersRaw)).map(weather => [weather.id, weather])
  );
  const { itemUseMax } = v.parse(SettingsSchema, JSON.parse(settingsRaw)).growth;
  return [
    http.get(`${API_BASE_URL}/me/characters`, ({ request }) => {
      const me = authenticate(db, request);
      if (me === null) return problem(HTTP_UNAUTHORIZED, "UNAUTHORIZED");
      const owned = db.ownedCharacterIds.get(me.id) ?? new Set<string>();
      const today = weathers.get(db.todayWeatherId);
      return HttpResponse.json({
        characters: characters
          .filter(character => owned.has(character.id))
          .map(character => {
            const bonus = today?.attribute === character.attribute ? today.bonus : { hp: 0, attack: 0, defence: 0 };
            return {
              id: character.id,
              name: character.name,
              attribute: character.attribute,
              description: character.description,
              assets: character.assets,
              stats: {
                hp: stat(character.base.hp, bonus.hp),
                attack: stat(character.base.attack, bonus.attack),
                defence: stat(character.base.defence, bonus.defence)
              },
              itemUses: { hp: 0, attack: 0, defence: 0 },
              itemUseMax
            };
          })
      } satisfies components["schemas"]["MyCharacterList"]);
    })
  ];
};
