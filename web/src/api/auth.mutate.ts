import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { CreateGuestCommand, PlayerModel } from "@/domain/player/player";

import { toApiError } from "./apiError";
import { saveAuthToken } from "./authToken";
import { apiClient } from "./client";
import { apiKeys } from "./keys";
import { meResponseToDomain } from "./me.mapper";

/** ゲストアカウントを作り、認証トークンを端末に保存する。失敗したら ApiError を投げる */
export const createGuest = async (command: CreateGuestCommand): Promise<PlayerModel> => {
  const { data, error, response } = await apiClient.POST("/auth/guest", { body: command });
  if (data === undefined) throw toApiError(response, error);
  saveAuthToken(data.token);
  return meResponseToDomain(data.me);
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
