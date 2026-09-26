import type { components } from "@/api/generated/schema";
import type { PlayerModel } from "@/domain/player/player";

/** api の `Me` を PlayerModel にする */
export const meResponseToDomain = (response: components["schemas"]["Me"]): PlayerModel => ({
  id: response.id,
  name: response.name,
  level: response.level,
  fuda: response.fuda,
  selectedCharacterId: response.selectedCharacterId
});
