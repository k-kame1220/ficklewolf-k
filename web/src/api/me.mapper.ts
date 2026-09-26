import type { PlayerModel } from "@/domain/player/player";

import type { components } from "./generated/schema";

/** api の `Me` を PlayerModel にする */
export const meResponseToDomain = (response: components["schemas"]["Me"]): PlayerModel => ({
  id: response.id,
  name: response.name,
  level: response.level,
  fuda: response.fuda,
  selectedCharacterId: response.selectedCharacterId
});
