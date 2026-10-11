import type { components } from "@/api/generated/schema";
import type { MyQuestModel } from "@/domain/quest/quest";

/** api の `MyQuestList` を ID で引ける Map にする（並びは api の順のまま） */
export const myQuestListToDomain = (
  response: components["schemas"]["MyQuestList"]
): ReadonlyMap<string, MyQuestModel> =>
  new Map(
    response.quests.map(quest => [
      quest.id,
      {
        id: quest.id,
        kind: quest.kind,
        name: quest.name,
        imageKey: quest.imageKey,
        attribute: quest.attribute,
        stageCount: quest.stageCount,
        turnCount: quest.turnCount,
        revealCount: quest.revealCount,
        isCleared: quest.isCleared
      }
    ])
  );
