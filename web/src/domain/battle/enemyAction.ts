import { attackMultiplier } from "../attribute/attribute";

import type { BattleEvent, EnemyAction, EnemyState, PlayerSetup, PlayerState } from "./types";

export const DEFEND_DAMAGE_RATE = 0.2;
export const ENEMY_DEFEND_RATE = 0.8;
export const DEATHBLOW_MULTIPLIER = 100;
export const PROVOCATION_BONUS = 10;
export const NUMBNESS_TURNS = 3;

export type EnemyActionInput = {
  readonly action: EnemyAction;
  readonly playerSetup: PlayerSetup;
  readonly player: PlayerState;
  readonly enemy: EnemyState;
  readonly numbnessTurns: number;
  readonly isDefending: boolean;
};

export type EnemyActionResult = {
  readonly player: PlayerState;
  readonly enemy: EnemyState;
  readonly enemyDefenceThisTurn: number;
  readonly numbnessTurns: number;
  readonly events: readonly BattleEvent[];
};

export const toDamage = (value: number): number => Math.floor(Math.max(0, value));

export const enemyAttackPower = (enemy: EnemyState, playerSetup: PlayerSetup): number =>
  enemy.setup.attack * attackMultiplier(enemy.attribute, playerSetup.attribute) + enemy.provocation;

export const playerAttackPower = (player: PlayerState, playerSetup: PlayerSetup, enemy: EnemyState): number =>
  playerSetup.attack * attackMultiplier(playerSetup.attribute, enemy.attribute) * player.attackMultiplier;

export const resolveEnemyAction = (input: EnemyActionInput): EnemyActionResult => {
  const { action, playerSetup, player, enemy, numbnessTurns, isDefending } = input;

  const playerDefence = playerSetup.defence + player.defenceBuffCount * playerSetup.defenceBuffAmount;
  const unchanged: EnemyActionResult = {
    player,
    enemy,
    enemyDefenceThisTurn: enemy.defence,
    numbnessTurns,
    events: [{ type: "enemyAction", action }]
  };

  const damagePlayer = (damage: number): EnemyActionResult => ({
    ...unchanged,
    player: { ...player, hp: Math.max(0, player.hp - damage) },
    events: [...unchanged.events, { type: "playerDamaged", amount: damage }]
  });

  const defendableDamage = (power: number): number =>
    toDamage(isDefending ? power * DEFEND_DAMAGE_RATE - playerDefence : power - playerDefence);

  switch (action) {
    case "attack":
      return damagePlayer(defendableDamage(enemyAttackPower(enemy, playerSetup) * enemy.attackMultiplier));
    case "strongAttack":
      return damagePlayer(defendableDamage(enemy.setup.strongAttackPower));
    case "fixedAttack":
      return damagePlayer(toDamage(enemy.setup.fixedAttackPower));
    case "deathblow":
      return damagePlayer(
        toDamage(enemyAttackPower(enemy, playerSetup) * enemy.attackMultiplier * DEATHBLOW_MULTIPLIER)
      );
    case "defend": {
      const playerPower = playerAttackPower(player, playerSetup, enemy);
      if (playerPower <= enemy.defence) return unchanged;
      return { ...unchanged, enemyDefenceThisTurn: playerPower * ENEMY_DEFEND_RATE };
    }
    case "attackBuff":
      return {
        ...unchanged,
        enemy: { ...enemy, attackMultiplier: enemy.attackMultiplier + enemy.setup.attackBuffRate }
      };
    case "defenceBuff": {
      const defence = enemy.defence + enemy.setup.defenceBuffAmount;
      return { ...unchanged, enemy: { ...enemy, defence }, enemyDefenceThisTurn: defence };
    }
    case "concentration":
      return unchanged;
    case "provocation":
      return { ...unchanged, enemy: { ...enemy, provocation: enemy.provocation + PROVOCATION_BONUS } };
    case "fullRecovery":
      return {
        ...unchanged,
        enemy: { ...enemy, hp: enemy.maxHp },
        events: [...unchanged.events, { type: "enemyRecovered", amount: enemy.maxHp - enemy.hp }]
      };
    case "rateRecovery": {
      const amount = Math.floor(enemy.maxHp * enemy.setup.recoveryRate);
      const hp = enemy.hp + amount;
      return {
        ...unchanged,
        enemy: { ...enemy, hp, maxHp: Math.max(enemy.maxHp, hp) },
        events: [...unchanged.events, { type: "enemyRecovered", amount }]
      };
    }
    case "changeAttribute": {
      const attribute = (() => {
        if (enemy.setup.changeAttribute === null) return enemy.attribute;
        if (enemy.attribute === enemy.setup.attribute) return enemy.setup.changeAttribute;
        return enemy.setup.attribute;
      })();
      return {
        ...unchanged,
        enemy: { ...enemy, attribute },
        events: [...unchanged.events, { type: "enemyAttributeChanged", attribute }]
      };
    }
    case "numbness":
      if (playerSetup.numbnessResistant) {
        return { ...unchanged, events: [...unchanged.events, { type: "numbnessResisted" }] };
      }
      return { ...unchanged, numbnessTurns: NUMBNESS_TURNS, events: [...unchanged.events, { type: "numbed" }] };
    case "attackDebuff":
      return {
        ...unchanged,
        player: { ...player, attackMultiplier: Math.max(0, player.attackMultiplier - enemy.setup.attackDebuff) }
      };
    case "defenceDebuff": {
      const debuffedCount = player.defenceBuffCount - enemy.setup.defenceDebuff;
      const defenceBuffCount = (() => {
        if (playerSetup.defence + debuffedCount * playerSetup.defenceBuffAmount > 0) return debuffedCount;
        return -(playerSetup.defence / playerSetup.defenceBuffAmount);
      })();
      return { ...unchanged, player: { ...player, defenceBuffCount } };
    }
  }
};
