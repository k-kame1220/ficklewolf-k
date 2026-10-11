import { queryOptions, useQuery } from "@tanstack/react-query";

import { apiClient } from "@/api/core/client";
import { parseResponse } from "@/api/core/response";
import type { MyQuestModel } from "@/domain/quest/quest";

import { questKeys } from "./quest.keys";
import { myQuestListToDomain } from "./quest.mapper";
import { MyQuestListResponseSchema } from "./quest.schema";

/** 挑戦できるクエストを取る（ID で引ける Map）。失敗したら ApiError / InvalidResponseError を投げる */
export const fetchMyQuests = async (): Promise<ReadonlyMap<string, MyQuestModel>> => {
  const result = await apiClient.GET("/me/quests");
  const body = parseResponse(result, MyQuestListResponseSchema);
  return myQuestListToDomain(body);
};

/** 挑戦できるクエストのクエリ */
export const myQuestsQueryOptions = queryOptions({ queryKey: questKeys.mine, queryFn: fetchMyQuests });

/** 挑戦できるクエスト（ID で引ける Map。並びは api の順） */
export const useMyQuests = () => useQuery(myQuestsQueryOptions);
