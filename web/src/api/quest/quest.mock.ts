import { http, HttpResponse } from "msw";
import * as v from "valibot";

import { API_BASE_URL } from "@/api/core/config";
import type { components } from "@/api/generated/schema";
import { authenticate, problem } from "@/api/mocks/db";
import type { MockDb } from "@/api/mocks/db";
import { ATTRIBUTES } from "@/domain/attribute/attribute";
import { QUEST_KINDS } from "@/domain/quest/quest";

const questsRaw =
  Object.values(
    import.meta.glob<string>("../../../../spec/master/quests.json", {
      eager: true,
      query: "?raw",
      import: "default"
    })
  )[0] ?? "null";

const HTTP_UNAUTHORIZED = 401;

const MasterStageSchema = v.object({
  imageKey: v.string(),
  revealCount: v.number(),
  battle: v.object({ attribute: v.picklist(ATTRIBUTES), turns: v.array(v.unknown()) })
});

const MasterQuestsSchema = v.array(
  v.object({
    id: v.string(),
    kind: v.picklist(QUEST_KINDS),
    name: v.string(),
    order: v.number(),
    weatherId: v.optional(v.string()),
    stages: v.tupleWithRest([MasterStageSchema], MasterStageSchema)
  })
);

/**
 * `GET /me/quests` のモック。spec/master/quests.json から、メインクエストを Lv の数だけ（`order` の順）と、
 * 今日の天気のお天気クエストを返す。イベントクエストはフェーズ 1.5 まで返さない。
 */
export const createQuestMockHandlers = (db: MockDb) => {
  const quests = v.parse(MasterQuestsSchema, JSON.parse(questsRaw));
  const mainQuests = quests.filter(quest => quest.kind === "main").toSorted((a, b) => a.order - b.order);
  const weatherQuests = quests.filter(quest => quest.kind === "weather");
  return [
    http.get(`${API_BASE_URL}/me/quests`, ({ request }) => {
      const me = authenticate(db, request);
      if (me === null) return problem(HTTP_UNAUTHORIZED, "UNAUTHORIZED");
      const cleared = db.clearedQuestIds.get(me.id) ?? new Set<string>();
      const available = [
        ...mainQuests.slice(0, me.level),
        ...weatherQuests.filter(quest => quest.weatherId === db.todayWeatherId)
      ];
      return HttpResponse.json({
        quests: available.map(quest => {
          const [firstStage] = quest.stages;
          return {
            id: quest.id,
            kind: quest.kind,
            name: quest.name,
            imageKey: firstStage.imageKey,
            attribute: firstStage.battle.attribute,
            stageCount: quest.stages.length,
            turnCount: firstStage.battle.turns.length,
            revealCount: firstStage.revealCount,
            isCleared: cleared.has(quest.id)
          };
        })
      } satisfies components["schemas"]["MyQuestList"]);
    })
  ];
};
