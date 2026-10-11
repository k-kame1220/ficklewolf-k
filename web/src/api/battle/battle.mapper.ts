import type { components } from "@/api/generated/schema";
import type { BattleEventModel, BattleModel, BattleStepModel, RewardModel } from "@/domain/battle/battle";

/** api の `Battle` をアプリの型にする */
export const battleToDomain = (battle: components["schemas"]["Battle"]): BattleModel => ({
  id: battle.id,
  questId: battle.questId,
  seq: battle.seq,
  phase: battle.phase,
  outcome: battle.outcome,
  stage: battle.stage,
  stageCount: battle.stageCount,
  turn: battle.turn,
  turnCount: battle.turnCount,
  player: {
    characterId: battle.player.characterId,
    name: battle.player.name,
    attribute: battle.player.attribute,
    assets: { main: battle.player.assets.main, icon: battle.player.assets.icon, home: battle.player.assets.home },
    hp: battle.player.hp,
    maxHp: battle.player.maxHp,
    attack: battle.player.attack,
    defence: battle.player.defence,
    attackRate: battle.player.attackRate,
    numbnessTurns: battle.player.numbnessTurns,
    checkRemaining: battle.player.checkRemaining,
    rewindRemaining: battle.player.rewindRemaining,
    specialRemaining: battle.player.specialRemaining,
    isSpecialAvailable: battle.player.isSpecialAvailable
  },
  enemy: {
    name: battle.enemy.name,
    imageKey: battle.enemy.imageKey,
    attribute: battle.enemy.attribute,
    hp: battle.enemy.hp,
    maxHp: battle.enemy.maxHp
  },
  checkpoints: battle.checkpoints,
  revealRemaining: battle.revealRemaining,
  history: battle.history.map(entry => ({
    stage: entry.stage,
    turn: entry.turn,
    command: entry.command ?? null,
    isParalyzed: entry.isParalyzed ?? false,
    enemyAction: entry.enemyAction
  }))
});

const rewardToDomain = (reward: components["schemas"]["Reward"]): RewardModel => ({
  level: reward.level,
  isLevelUp: reward.isLevelUp,
  fudaGained: reward.fudaGained,
  recruitedCharacterId: reward.recruitedCharacterId,
  duplicate:
    reward.duplicate === null ? null : { characterId: reward.duplicate.characterId, stat: reward.duplicate.stat },
  items: reward.items.map(item => ({ itemId: item.itemId, count: item.count }))
});

/** api の `BattleStepResult` をアプリの型にする */
export const battleStepToDomain = (step: components["schemas"]["BattleStepResult"]): BattleStepModel => ({
  events: step.events.map((event): BattleEventModel => ({ ...event })),
  battle: battleToDomain(step.battle),
  reward: step.reward === null ? null : rewardToDomain(step.reward)
});
