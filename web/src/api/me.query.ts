import { queryOptions, useQuery } from "@tanstack/react-query";

import { toApiError } from "./apiError";
import { apiClient } from "./client";
import { apiKeys } from "./keys";
import { toMeModel } from "./me.model";

import type { MeModel } from "./me.model";

/** 自分のプロフィールを取る。失敗したら ApiError を投げる（未認証は 401） */
export const fetchMe = async (): Promise<MeModel> => {
  const { data, error, response } = await apiClient.GET("/me");
  if (data === undefined) throw toApiError(response, error);
  return toMeModel(data);
};

/** 自分のプロフィールのクエリ */
export const meQueryOptions = queryOptions({ queryKey: apiKeys.me, queryFn: fetchMe });

/** 自分のプロフィール */
export const useMe = () => useQuery(meQueryOptions);
