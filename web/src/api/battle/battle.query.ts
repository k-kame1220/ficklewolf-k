import { queryOptions, useQuery } from "@tanstack/react-query";

import { ApiError } from "@/api/core/apiError";
import { apiClient } from "@/api/core/client";
import { parseResponse } from "@/api/core/response";
import type { BattleModel } from "@/domain/battle/battle";

import { battleKeys } from "./battle.keys";
import { battleToDomain } from "./battle.mapper";
import { BattleResponseSchema } from "./battle.schema";

/** 進行中のバトルを取る。無ければ（`NO_ACTIVE_BATTLE`）null。ほかの失敗は ApiError / InvalidResponseError を投げる */
export const fetchCurrentBattle = async (): Promise<BattleModel | null> => {
  const result = await apiClient.GET("/quest-sessions/current");
  try {
    return battleToDomain(parseResponse(result, BattleResponseSchema));
  } catch (error) {
    if (error instanceof ApiError && error.code === "NO_ACTIVE_BATTLE") return null;
    throw error;
  }
};

/**
 * 進行中のバトルのクエリ。バトル画面を開いたときに 1 回だけ取る（演出の途中で取り直さない）。
 * 取り直すとき（`STALE_SEQUENCE`）は `freshCurrentBattleQueryOptions` を使う
 */
export const currentBattleQueryOptions = queryOptions({
  queryKey: battleKeys.current,
  queryFn: fetchCurrentBattle,
  staleTime: Infinity
});

/** 進行中のバトルを必ず api から取り直すクエリ */
export const freshCurrentBattleQueryOptions = queryOptions({ ...currentBattleQueryOptions, staleTime: 0 });

/** 進行中のバトル（無ければ null） */
export const useCurrentBattle = () => useQuery(currentBattleQueryOptions);
