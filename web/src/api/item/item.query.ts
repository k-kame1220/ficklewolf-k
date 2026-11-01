import { queryOptions, useQuery } from "@tanstack/react-query";

import { apiClient } from "@/api/core/client";
import { parseResponse } from "@/api/core/response";
import type { MyItemModel } from "@/domain/item/item";

import { itemKeys } from "./item.keys";
import { myItemListToDomain } from "./item.mapper";
import { MyItemListResponseSchema } from "./item.schema";

/** 所持アイテムを取る（`items.json` の順）。失敗したら ApiError / InvalidResponseError を投げる */
export const fetchMyItems = async (): Promise<readonly MyItemModel[]> => {
  const result = await apiClient.GET("/me/items");
  const body = parseResponse(result, MyItemListResponseSchema);
  return myItemListToDomain(body);
};

/** 所持アイテムのクエリ */
export const myItemsQueryOptions = queryOptions({ queryKey: itemKeys.mine, queryFn: fetchMyItems });

/** 所持アイテム（`items.json` の順） */
export const useMyItems = () => useQuery(myItemsQueryOptions);
