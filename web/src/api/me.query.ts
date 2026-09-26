import { queryOptions, useQuery } from "@tanstack/react-query";

import type { PlayerModel } from "@/domain/player/player";

import { toApiError } from "./apiError";
import { apiClient } from "./client";
import { apiKeys } from "./keys";
import { meResponseToDomain } from "./me.mapper";

/** 自分のプロフィールを取る。失敗したら ApiError を投げる（未認証は 401） */
export const fetchMe = async (): Promise<PlayerModel> => {
  const { data, error, response } = await apiClient.GET("/me");
  if (data === undefined) throw toApiError(response, error);
  return meResponseToDomain(data);
};

/** 自分のプロフィールのクエリ */
export const meQueryOptions = queryOptions({ queryKey: apiKeys.me, queryFn: fetchMe });

/** 自分のプロフィール */
export const useMe = () => useQuery(meQueryOptions);
