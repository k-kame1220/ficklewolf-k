import * as v from "valibot";

import type { components } from "@/api/generated/schema";
import { ATTRIBUTES } from "@/domain/attribute/attribute";

const StatBreakdownSchema = v.object({
  base: v.number(),
  bonus: v.object({ item: v.number(), duplicate: v.number(), weather: v.number() }),
  total: v.number()
});

const StatCountsSchema = v.object({ hp: v.number(), attack: v.number(), defence: v.number() });

/** api の `MyCharacter` */
export const MyCharacterResponseSchema = v.object({
  id: v.string(),
  name: v.string(),
  attribute: v.picklist(ATTRIBUTES),
  description: v.string(),
  assets: v.object({ main: v.string(), icon: v.string(), home: v.string() }),
  stats: v.object({ hp: StatBreakdownSchema, attack: StatBreakdownSchema, defence: StatBreakdownSchema }),
  itemUses: StatCountsSchema,
  itemUseMax: StatCountsSchema
}) satisfies v.GenericSchema<unknown, components["schemas"]["MyCharacter"]>;

/** api の `MyCharacterList` */
export const MyCharacterListResponseSchema = v.object({
  characters: v.array(MyCharacterResponseSchema)
}) satisfies v.GenericSchema<unknown, components["schemas"]["MyCharacterList"]>;
