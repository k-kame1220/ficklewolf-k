import { http, HttpResponse } from "msw";
import * as v from "valibot";

import { API_BASE_URL } from "@/api/core/config";
import type { components } from "@/api/generated/schema";
import { readMasterItems } from "@/api/item/item.mock";
import { authenticate, problem, readJson } from "@/api/mocks/db";
import type { MockDb, MockStatCounts } from "@/api/mocks/db";
import { ATTRIBUTES } from "@/domain/attribute/attribute";
import { STATS } from "@/domain/stat/stat";

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

const HTTP_BAD_REQUEST = 400;
const HTTP_UNAUTHORIZED = 401;
const HTTP_NOT_FOUND = 404;
const HTTP_CONFLICT = 409;

const ZERO_COUNTS: MockStatCounts = { hp: 0, attack: 0, defence: 0 };

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
const SettingsSchema = v.object({ growth: v.object({ itemUseMax: StatsSchema, itemBonusPerUse: StatsSchema }) });

const CountSchema = v.pipe(v.number(), v.integer(), v.minValue(0));
const EnhanceSchema = v.strictObject({ hp: CountSchema, attack: CountSchema, defence: CountSchema });

/**
 * `GET /me/characters`・`POST /me/characters/{characterId}/enhance` のモック。キャラは spec/master/characters.json から作る。
 * ステータスは基礎・アイテム・今日の天気のボーナス（被りはまだモックしない）
 */
export const createCharacterMockHandlers = (db: MockDb) => {
  const characters = v.parse(MasterCharactersSchema, JSON.parse(charactersRaw));
  const charactersById = new Map(characters.map(character => [character.id, character]));
  const weathers = new Map(
    v.parse(MasterWeathersSchema, JSON.parse(weathersRaw)).map(weather => [weather.id, weather])
  );
  const { itemUseMax, itemBonusPerUse } = v.parse(SettingsSchema, JSON.parse(settingsRaw)).growth;
  const itemsByAttributeAndStat = new Map(readMasterItems().map(item => [`${item.attribute}:${item.stat}`, item]));

  const toMyCharacter = (
    character: (typeof characters)[number],
    uses: MockStatCounts
  ): components["schemas"]["MyCharacter"] => {
    const today = weathers.get(db.todayWeatherId);
    const weather = today?.attribute === character.attribute ? today.bonus : ZERO_COUNTS;
    const stat = (key: (typeof STATS)[number]): components["schemas"]["StatBreakdown"] => {
      const item = uses[key] * itemBonusPerUse[key];
      return {
        base: character.base[key],
        bonus: { item, duplicate: 0, weather: weather[key] },
        total: character.base[key] + item + weather[key]
      };
    };
    return {
      id: character.id,
      name: character.name,
      attribute: character.attribute,
      description: character.description,
      assets: character.assets,
      stats: { hp: stat("hp"), attack: stat("attack"), defence: stat("defence") },
      itemUses: uses,
      itemUseMax
    };
  };

  return [
    http.get(`${API_BASE_URL}/me/characters`, ({ request }) => {
      const me = authenticate(db, request);
      if (me === null) return problem(HTTP_UNAUTHORIZED, "UNAUTHORIZED");
      const owned = db.ownedCharacterIds.get(me.id) ?? new Set<string>();
      const uses = db.itemUses.get(me.id) ?? new Map<string, MockStatCounts>();
      return HttpResponse.json({
        characters: characters
          .filter(character => owned.has(character.id))
          .map(character => toMyCharacter(character, uses.get(character.id) ?? ZERO_COUNTS))
      } satisfies components["schemas"]["MyCharacterList"]);
    }),

    http.post(`${API_BASE_URL}/me/characters/:characterId/enhance`, async ({ request, params }) => {
      const me = authenticate(db, request);
      if (me === null) return problem(HTTP_UNAUTHORIZED, "UNAUTHORIZED");

      const body = v.safeParse(EnhanceSchema, await readJson(request));
      if (!body.success || body.output.hp + body.output.attack + body.output.defence === 0) {
        return problem(HTTP_BAD_REQUEST, "VALIDATION_FAILED");
      }
      const counts = body.output;

      const characterId = String(params.characterId);
      const character = charactersById.get(characterId);
      if (character === undefined || db.ownedCharacterIds.get(me.id)?.has(characterId) !== true) {
        return problem(HTTP_NOT_FOUND, "CHARACTER_NOT_OWNED");
      }

      const usesByCharacter = db.itemUses.get(me.id) ?? new Map<string, MockStatCounts>();
      const current = usesByCharacter.get(characterId) ?? ZERO_COUNTS;
      const nextUses: MockStatCounts = {
        hp: current.hp + counts.hp,
        attack: current.attack + counts.attack,
        defence: current.defence + counts.defence
      };
      const isOverLimit =
        nextUses.hp > itemUseMax.hp || nextUses.attack > itemUseMax.attack || nextUses.defence > itemUseMax.defence;
      if (isOverLimit) return problem(HTTP_CONFLICT, "ENHANCE_LIMIT_EXCEEDED");

      const itemCounts = db.itemCounts.get(me.id) ?? new Map<string, number>();
      const used = STATS.filter(key => counts[key] > 0).map(key => {
        const item = itemsByAttributeAndStat.get(`${character.attribute}:${key}`);
        const left = (item === undefined ? 0 : (itemCounts.get(item.id) ?? 0)) - counts[key];
        return { itemId: item?.id ?? "", left };
      });
      const notEnough = used.filter(item => item.itemId === "" || item.left < 0);
      if (notEnough.length > 0) return problem(HTTP_CONFLICT, "ITEM_NOT_ENOUGH");

      db.itemCounts.set(me.id, new Map([...itemCounts, ...used.map(item => [item.itemId, item.left] as const)]));
      db.itemUses.set(me.id, new Map([...usesByCharacter, [characterId, nextUses]]));
      return HttpResponse.json(toMyCharacter(character, nextUses));
    })
  ];
};
