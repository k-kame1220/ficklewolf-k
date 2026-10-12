import * as v from "valibot";

import type { components } from "@/api/generated/schema";
import { ATTRIBUTES } from "@/domain/attribute/attribute";

const PLAYER_ACTION_COMMANDS = ["attack", "defend", "attackBuff", "defenceBuff"] as const;
const ENEMY_ACTIONS = [
  "attack",
  "defend",
  "attackBuff",
  "defenceBuff",
  "fixedAttack",
  "strongAttack",
  "concentration",
  "deathblow",
  "provocation",
  "fullRecovery",
  "rateRecovery",
  "changeAttribute",
  "numbness",
  "attackDebuff",
  "defenceDebuff"
] as const satisfies readonly components["schemas"]["EnemyAction"][];
const SPECIAL_ACTIONS = [
  "attack",
  "defend",
  "attackBuff",
  "defenceBuff",
  "provocation"
] as const satisfies readonly components["schemas"]["SpecialAction"][];

const BattleSchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
  questId: v.string(),
  seq: v.number(),
  phase: v.picklist(["command", "choosingSpecial", "finished"]),
  outcome: v.picklist(["ongoing", "win", "lose"]),
  stage: v.number(),
  stageCount: v.number(),
  turn: v.number(),
  turnCount: v.number(),
  player: v.object({
    characterId: v.string(),
    name: v.string(),
    attribute: v.picklist(ATTRIBUTES),
    assets: v.object({ main: v.string(), icon: v.string(), home: v.string() }),
    hp: v.number(),
    maxHp: v.number(),
    attack: v.number(),
    defence: v.number(),
    attackRate: v.number(),
    numbnessTurns: v.number(),
    checkRemaining: v.number(),
    rewindRemaining: v.number(),
    specialRemaining: v.number(),
    isSpecialAvailable: v.boolean()
  }),
  enemy: v.object({
    name: v.string(),
    imageKey: v.string(),
    attribute: v.picklist(ATTRIBUTES),
    hp: v.number(),
    maxHp: v.number()
  }),
  checkpoints: v.array(v.number()),
  revealRemaining: v.number(),
  history: v.array(
    v.object({
      stage: v.number(),
      turn: v.number(),
      command: v.exactOptional(v.picklist(PLAYER_ACTION_COMMANDS)),
      isParalyzed: v.exactOptional(v.boolean()),
      enemyAction: v.picklist(ENEMY_ACTIONS)
    })
  ),
  expiresAt: v.string()
});

/** api の `Battle` */
export const BattleResponseSchema = BattleSchema satisfies v.GenericSchema<unknown, components["schemas"]["Battle"]>;

const BattleEventSchema = v.variant("type", [
  v.object({
    type: v.literal("playerAction"),
    command: v.picklist(PLAYER_ACTION_COMMANDS),
    isParalyzed: v.boolean(),
    damage: v.number(),
    playerHp: v.number(),
    enemyHp: v.number()
  }),
  v.object({
    type: v.literal("enemyAction"),
    action: v.picklist(ENEMY_ACTIONS),
    damage: v.number(),
    playerHp: v.number(),
    enemyHp: v.number()
  }),
  v.object({ type: v.literal("stageCleared"), nextStage: v.number() }),
  v.object({ type: v.literal("checked"), turn: v.number() }),
  v.object({ type: v.literal("rewound"), to: v.number() }),
  v.object({ type: v.literal("specialApplied"), turn: v.number(), action: v.picklist(SPECIAL_ACTIONS) }),
  v.object({ type: v.literal("finished"), outcome: v.picklist(["win", "lose"]) })
]);

const RewardSchema = v.object({
  level: v.number(),
  isLevelUp: v.boolean(),
  fudaGained: v.number(),
  recruitedCharacterId: v.nullable(v.string()),
  duplicate: v.nullable(v.object({ characterId: v.string(), stat: v.picklist(["hp", "attack", "defence"]) })),
  items: v.array(v.object({ itemId: v.string(), count: v.number() }))
});

/** api の `BattleStepResult` */
export const BattleStepResponseSchema = v.object({
  events: v.array(BattleEventSchema),
  battle: BattleSchema,
  reward: v.nullable(RewardSchema)
}) satisfies v.GenericSchema<unknown, components["schemas"]["BattleStepResult"]>;
