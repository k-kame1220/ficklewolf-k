import { queryOptions } from "@tanstack/react-query";

import { apiClient } from "@/api/core/client";
import { parseResponse } from "@/api/core/response";

import { appKeys } from "./app.keys";
import { AppVersionResponseSchema } from "./app.schema";

/** 必要なアプリの最低バージョンを取る。失敗したら ApiError / InvalidResponseError を投げる */
export const fetchMinAppVersion = async (): Promise<string> => {
  const result = await apiClient.GET("/app/version");
  return parseResponse(result, AppVersionResponseSchema).minAppVersion;
};

/** 必要なアプリの最低バージョンのクエリ（起動時に 1 回だけ取る） */
export const minAppVersionQueryOptions = queryOptions({
  queryKey: appKeys.version,
  queryFn: fetchMinAppVersion,
  staleTime: "static"
});
