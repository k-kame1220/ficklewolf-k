import { queryOptions, useQuery } from "@tanstack/react-query";

import { apiClient } from "@/api/core/client";
import { parseResponse } from "@/api/core/response";
import type { PlayerModel } from "@/domain/player/player";

import { meKeys } from "./me.keys";
import { meResponseToDomain } from "./me.mapper";
import { MeResponseSchema } from "./me.schema";

/** 自分のプロフィールを取る。失敗したら ApiError（未認証は 401）/ InvalidResponseError を投げる */
export const fetchMe = async (): Promise<PlayerModel> => {
  const result = await apiClient.GET("/me");
  const body = parseResponse(result, MeResponseSchema);
  return meResponseToDomain(body);
};

/** 自分のプロフィールのクエリ */
export const meQueryOptions = queryOptions({ queryKey: meKeys.me, queryFn: fetchMe });

/** 自分のプロフィール */
export const useMe = () => useQuery(meQueryOptions);
