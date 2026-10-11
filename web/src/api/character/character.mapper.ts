import type { components } from "@/api/generated/schema";
import type { MyCharacterModel } from "@/domain/character/character";

/** api の `MyCharacterList` を ID で引ける Map にする（並びは api の順のまま） */
export const myCharacterListToDomain = (
  response: components["schemas"]["MyCharacterList"]
): ReadonlyMap<string, MyCharacterModel> =>
  new Map(
    response.characters.map(character => [
      character.id,
      {
        id: character.id,
        name: character.name,
        attribute: character.attribute,
        description: character.description,
        assets: { main: character.assets.main, icon: character.assets.icon, home: character.assets.home }
      }
    ])
  );
