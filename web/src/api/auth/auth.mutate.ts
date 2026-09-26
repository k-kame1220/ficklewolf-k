import { useMutation, useQueryClient } from "@tanstack/react-query";

import { saveAuthToken } from "@/api/core/authToken";
import { apiClient } from "@/api/core/client";
import { parseResponse } from "@/api/core/response";
import { meKeys } from "@/api/me/me.keys";
import { meResponseToDomain } from "@/api/me/me.mapper";
import type { CreateGuestCommand, PlayerModel } from "@/domain/player/player";

import { CreateGuestResponseSchema } from "./auth.schema";

/** ゲストアカウントを作り、認証トークンを端末に保存する。失敗したら ApiError / InvalidResponseError を投げる */
export const createGuest = async (command: CreateGuestCommand): Promise<PlayerModel> => {
  const result = await apiClient.POST("/auth/guest", { body: command });
  const body = parseResponse(result, CreateGuestResponseSchema);
  saveAuthToken(body.token);
  return meResponseToDomain(body.me);
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
