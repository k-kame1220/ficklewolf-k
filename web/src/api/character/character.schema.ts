import * as v from "valibot";

import type { components } from "@/api/generated/schema";
import { ATTRIBUTES } from "@/domain/attribute/attribute";

/** api の `MyCharacterList` */
export const MyCharacterListResponseSchema = v.object({
  characters: v.array(
    v.object({
      id: v.string(),
      name: v.string(),
      attribute: v.picklist(ATTRIBUTES),
      description: v.string(),
      assets: v.object({ main: v.string(), icon: v.string(), home: v.string() })
    })
  )
}) satisfies v.GenericSchema<unknown, components["schemas"]["MyCharacterList"]>;
