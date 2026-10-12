import type { components } from "@/api/generated/schema";
import type { MyCharacterModel, StatBreakdownModel } from "@/domain/character/character";

const statToDomain = (stat: components["schemas"]["StatBreakdown"]): StatBreakdownModel => ({
  base: stat.base,
  bonus: { item: stat.bonus.item, duplicate: stat.bonus.duplicate, weather: stat.bonus.weather },
  total: stat.total
});

/** api の `MyCharacter` をアプリの型にする */
export const myCharacterToDomain = (character: components["schemas"]["MyCharacter"]): MyCharacterModel => ({
  id: character.id,
  name: character.name,
  attribute: character.attribute,
  description: character.description,
  assets: { main: character.assets.main, icon: character.assets.icon, home: character.assets.home },
  stats: {
    hp: statToDomain(character.stats.hp),
    attack: statToDomain(character.stats.attack),
    defence: statToDomain(character.stats.defence)
  },
  itemUses: { hp: character.itemUses.hp, attack: character.itemUses.attack, defence: character.itemUses.defence },
  itemUseMax: {
    hp: character.itemUseMax.hp,
    attack: character.itemUseMax.attack,
    defence: character.itemUseMax.defence
  }
});

/** api の `MyCharacterList` を ID で引ける Map にする（並びは api の順のまま） */
export const myCharacterListToDomain = (
  response: components["schemas"]["MyCharacterList"]
): ReadonlyMap<string, MyCharacterModel> =>
  new Map(response.characters.map(character => [character.id, myCharacterToDomain(character)]));
