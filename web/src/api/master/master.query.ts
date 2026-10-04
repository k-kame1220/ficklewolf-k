import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";

import { apiClient } from "@/api/core/client";
import { parseResponse } from "@/api/core/response";
import type { MasterModel } from "@/domain/master/master";

import { masterKeys } from "./master.keys";
import { masterResponseToDomain } from "./master.mapper";
import { MasterResponseSchema, MasterVersionResponseSchema } from "./master.schema";

/** マスタのバージョンと、必要なアプリの最低バージョン */
export type MasterVersionModel = {
  readonly masterVersion: string;
  readonly minAppVersion: string;
};

/** マスタのバージョンを取る。失敗したら ApiError / InvalidResponseError を投げる */
export const fetchMasterVersion = async (): Promise<MasterVersionModel> => {
  const result = await apiClient.GET("/master/version");
  return parseResponse(result, MasterVersionResponseSchema);
};

/** マスタ一式を取る（HTTP キャッシュに任せるので、変わっていなければ通信は 304 で済む）。失敗したら ApiError / InvalidResponseError を投げる */
export const fetchMaster = async (): Promise<MasterModel> => {
  const result = await apiClient.GET("/master");
  const body = parseResponse(result, MasterResponseSchema);
  return masterResponseToDomain(body);
};

/** マスタのバージョンのクエリ（起動時に 1 回だけ取る） */
export const masterVersionQueryOptions = queryOptions({
  queryKey: masterKeys.version,
  queryFn: fetchMasterVersion,
  staleTime: "static"
});

/** マスタ一式のクエリ（起動中は取り直さない） */
export const masterQueryOptions = queryOptions({
  queryKey: masterKeys.master,
  queryFn: fetchMaster,
  staleTime: "static"
});

/** マスタ一式。起動時（ルートの beforeLoad）に読み込み済みの前提で使う */
export const useMaster = (): MasterModel => useSuspenseQuery(masterQueryOptions).data;
