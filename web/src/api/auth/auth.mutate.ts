import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toApiError } from "@/api/core/apiError";
import { saveAuthToken } from "@/api/core/authToken";
import { apiClient } from "@/api/core/client";
import { meKeys } from "@/api/me/me.keys";
import { meResponseToDomain } from "@/api/me/me.mapper";
import type { CreateGuestCommand, PlayerModel } from "@/domain/player/player";

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
      queryClient.setQueryData(meKeys.me, me);
    }
  });
};
