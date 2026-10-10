import { queryOptions, useQuery } from "@tanstack/react-query";

import { apiClient } from "@/api/core/client";
import { parseResponse } from "@/api/core/response";
import type { MyCharacterModel } from "@/domain/character/character";

import { characterKeys } from "./character.keys";
import { myCharacterListToDomain } from "./character.mapper";
import { MyCharacterListResponseSchema } from "./character.schema";

/** 所持キャラを取る（ID で引ける Map）。失敗したら ApiError / InvalidResponseError を投げる */
export const fetchMyCharacters = async (): Promise<ReadonlyMap<string, MyCharacterModel>> => {
  const result = await apiClient.GET("/me/characters");
  const body = parseResponse(result, MyCharacterListResponseSchema);
  return myCharacterListToDomain(body);
};

/** 所持キャラのクエリ */
export const myCharactersQueryOptions = queryOptions({ queryKey: characterKeys.mine, queryFn: fetchMyCharacters });

/** 所持キャラ（ID で引ける Map） */
export const useMyCharacters = () => useQuery(myCharactersQueryOptions);
