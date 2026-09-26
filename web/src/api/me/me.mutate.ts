import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/api/core/client";
import { parseResponse } from "@/api/core/response";
import type { PlayerModel, UpdatePlayerCommand } from "@/domain/player/player";

import { meKeys } from "./me.keys";
import { meResponseToDomain } from "./me.mapper";
import { MeResponseSchema } from "./me.schema";

/** プロフィールを変える。失敗したら ApiError / InvalidResponseError を投げる */
export const updateMe = async (command: UpdatePlayerCommand): Promise<PlayerModel> => {
  const result = await apiClient.PATCH("/me", { body: command });
  const body = parseResponse(result, MeResponseSchema);
  return meResponseToDomain(body);
};

/** プロフィールを変える。成功したらキャッシュを新しいプロフィールにする */
export const useUpdateMe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateMe,
    onSuccess: me => {
      queryClient.setQueryData(meKeys.me, me);
    }
  });
};
