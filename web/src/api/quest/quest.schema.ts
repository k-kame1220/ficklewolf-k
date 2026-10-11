import * as v from "valibot";

import type { components } from "@/api/generated/schema";
import { ATTRIBUTES } from "@/domain/attribute/attribute";
import { QUEST_KINDS } from "@/domain/quest/quest";

/** api の `MyQuestList` */
export const MyQuestListResponseSchema = v.object({
  quests: v.array(
    v.object({
      id: v.string(),
      kind: v.picklist(QUEST_KINDS),
      name: v.string(),
      imageKey: v.string(),
      attribute: v.picklist(ATTRIBUTES),
      stageCount: v.number(),
      turnCount: v.number(),
      revealCount: v.number(),
      isCleared: v.boolean()
    })
  )
}) satisfies v.GenericSchema<unknown, components["schemas"]["MyQuestList"]>;
