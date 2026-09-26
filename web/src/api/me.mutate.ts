import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toApiError } from "./apiError";
import { apiClient } from "./client";
import { apiKeys } from "./keys";
import { toMeModel } from "./me.model";

import type { MeModel } from "./me.model";

/** プロフィールの変更内容。送った項目だけを変える（1 項目以上） */
export type UpdateMeInput = {
  readonly name?: string;
  /** 所持しているキャラの ID */
  readonly selectedCharacterId?: string;
};

/** プロフィールを変える。失敗したら ApiError を投げる */
export const updateMe = async (input: UpdateMeInput): Promise<MeModel> => {
  const { data, error, response } = await apiClient.PATCH("/me", { body: input });
  if (data === undefined) throw toApiError(response, error);
  return toMeModel(data);
};

/** プロフィールを変える。成功したらキャッシュを新しいプロフィールにする */
export const useUpdateMe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateMe,
    onSuccess: me => {
      queryClient.setQueryData(apiKeys.me, me);
    }
  });
};
