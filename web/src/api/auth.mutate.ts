import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toApiError } from "./apiError";
import { saveAuthToken } from "./authToken";
import { apiClient } from "./client";
import { apiKeys } from "./keys";
import { toMeModel } from "./me.model";

import type { MeModel } from "./me.model";

/** ゲストアカウントを作り、認証トークンを端末に保存する。失敗したら ApiError を投げる */
export const createGuest = async (name: string): Promise<MeModel> => {
  const { data, error, response } = await apiClient.POST("/auth/guest", { body: { name } });
  if (data === undefined) throw toApiError(response, error);
  saveAuthToken(data.token);
  return toMeModel(data.me);
};

/** ゲストアカウントを作る。成功したらプロフィールをキャッシュに入れる */
export const useCreateGuest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createGuest,
    onSuccess: me => {
      queryClient.setQueryData(apiKeys.me, me);
    }
  });
};
