import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toApiError } from "@/api/core/apiError";
import { apiClient } from "@/api/core/client";
import type { PlayerModel, UpdatePlayerCommand } from "@/domain/player/player";

import { meKeys } from "./me.keys";
import { meResponseToDomain } from "./me.mapper";

/** プロフィールを変える。失敗したら ApiError を投げる */
export const updateMe = async (command: UpdatePlayerCommand): Promise<PlayerModel> => {
  const { data, error, response } = await apiClient.PATCH("/me", { body: command });
  if (data === undefined) throw toApiError(response, error);
  return meResponseToDomain(data);
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
