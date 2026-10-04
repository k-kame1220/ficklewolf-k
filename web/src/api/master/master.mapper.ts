import type { MasterModel } from "@/domain/master/master";

import type { MasterResponse } from "./master.schema";

/** api の `Master` を MasterModel にする（各マスタは ID で引ける Map にする） */
export const masterResponseToDomain = (response: MasterResponse): MasterModel => ({
  version: response.version,
  attributes: new Map(response.attributes.map(attribute => [attribute.id, attribute])),
  characters: new Map(response.characters.map(character => [character.id, character])),
  quests: new Map(
    response.quests.map(quest => [
      quest.id,
      {
        ...quest,
        weatherId: quest.weatherId ?? null,
        bannerKey: quest.bannerKey ?? null,
        bgmKey: quest.bgmKey ?? null
      }
    ])
  ),
  weathers: new Map(response.weathers.map(weather => [weather.id, weather])),
  items: new Map(response.items.map(item => [item.id, item])),
  settings: response.settings
});
