import type { components } from "@/api/generated/schema";
import type { MyItemModel } from "@/domain/item/item";

/** api の `MyItemList` をアプリの型にする（並びは api の順のまま） */
export const myItemListToDomain = (response: components["schemas"]["MyItemList"]): readonly MyItemModel[] =>
  response.items.map(item => ({
    id: item.id,
    name: item.name,
    attribute: item.attribute,
    stat: item.stat,
    iconKey: item.iconKey,
    count: item.count
  }));
