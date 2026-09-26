import { attackMultiplier } from "../attribute/attribute";

import type { BattleEvent, EnemyAction, EnemyState, PlayerSetup, PlayerState } from "./types";

/** 防御中に受ける `attack` / `strongAttack` の攻撃力に掛ける倍率 */
export const DEFEND_DAMAGE_RATE = 0.2;
/** 敵の `defend` で、このターンの敵の防御力を「プレイヤーの攻撃力 × この値」にする */
export const ENEMY_DEFEND_RATE = 0.8;
/** 挑発 1 回で敵の攻撃力に足す値 */
export const PROVOCATION_BONUS = 10;
/** ビリビリを受けたときの残りターン数 */
export const NUMBNESS_TURNS = 3;

/** 敵の行動を処理するのに必要な値 */
export type EnemyActionInput = {
  readonly action: EnemyAction;
  readonly playerSetup: PlayerSetup;
  readonly player: PlayerState;
  readonly enemy: EnemyState;
  /** 敵の行動の前のビリビリの残りターン数 */
  readonly numbnessTurns: number;
  /** このターンにプレイヤーが防御しているか（しびれて失敗したときは false） */
  readonly isDefending: boolean;
};

/** 敵の行動の結果 */
export type EnemyActionResult = {
  readonly player: PlayerState;
  readonly enemy: EnemyState;
  /** このターンのプレイヤーの攻撃に使う敵の防御力（敵の `defend` を反映） */
  readonly enemyDefenceThisTurn: number;
  readonly numbnessTurns: number;
  readonly events: readonly BattleEvent[];
};

/** 計算したダメージを HP に反映する値にする（0 未満にせず、切り捨てる） */
export const toDamage = (value: number): number => Math.floor(Math.max(0, value));

/** 敵の攻撃力（属性の倍率と挑発を反映。攻撃倍率は掛けない） */
export const enemyAttackPower = (enemy: EnemyState, playerSetup: PlayerSetup): number =>
  enemy.setup.attack * attackMultiplier(enemy.attribute, playerSetup.attribute) + enemy.provocation;

/** プレイヤーの攻撃力（属性の倍率と攻撃倍率を反映） */
export const playerAttackPower = (player: PlayerState, playerSetup: PlayerSetup, enemy: EnemyState): number =>
  playerSetup.attack * attackMultiplier(playerSetup.attribute, enemy.attribute) * player.attackMultiplier;

/** 1 ターン分の敵の行動（③）を処理する。プレイヤーの HP が 0 になっても決着の判定はしない */
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
      return damagePlayer(player.hp);
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
