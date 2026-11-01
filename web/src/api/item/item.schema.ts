import * as v from "valibot";

import type { components } from "@/api/generated/schema";
import { ATTRIBUTES } from "@/domain/attribute/attribute";
import { STATS } from "@/domain/stat/stat";

/** api の `MyItemList` */
export const MyItemListResponseSchema = v.object({
  items: v.array(
    v.object({
      id: v.string(),
      name: v.string(),
      attribute: v.picklist(ATTRIBUTES),
      stat: v.picklist(STATS),
      iconKey: v.string(),
      count: v.number()
    })
  )
}) satisfies v.GenericSchema<unknown, components["schemas"]["MyItemList"]>;
