import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/api/core/client";
import { parseResponse } from "@/api/core/response";
import { itemKeys } from "@/api/item/item.keys";
import type { EnhanceCharacterCommand, MyCharacterModel } from "@/domain/character/character";

import { characterKeys } from "./character.keys";
import { myCharacterToDomain } from "./character.mapper";
import { MyCharacterResponseSchema } from "./character.schema";

/** アイテムを使ってキャラを強化する。失敗したら ApiError / InvalidResponseError を投げる */
export const enhanceCharacter = async (command: EnhanceCharacterCommand): Promise<MyCharacterModel> => {
  const result = await apiClient.POST("/me/characters/{characterId}/enhance", {
    params: { path: { characterId: command.characterId } },
    body: command.counts
  });
  const body = parseResponse(result, MyCharacterResponseSchema);
  return myCharacterToDomain(body);
};

/** キャラを強化する。成功したらそのキャラをキャッシュで差し替え、所持アイテムを取り直す */
export const useEnhanceCharacter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: enhanceCharacter,
    onSuccess: async character => {
      queryClient.setQueryData<ReadonlyMap<string, MyCharacterModel>>(characterKeys.mine, characters =>
        characters === undefined ? characters : new Map([...characters, [character.id, character]])
      );
      await queryClient.invalidateQueries({ queryKey: itemKeys.mine });
    }
  });
};
