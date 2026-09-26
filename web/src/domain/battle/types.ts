import type { Attribute } from "../attribute/attribute";

export const ENEMY_ACTIONS = [
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
] as const;

export type EnemyAction = (typeof ENEMY_ACTIONS)[number];

export const PLAYER_ACTIONS = ["attack", "defend", "attackBuff", "defenceBuff"] as const;

export type PlayerAction = (typeof PLAYER_ACTIONS)[number];

export const SPECIAL_ACTIONS = ["attack", "defend", "attackBuff", "defenceBuff", "provocation"] as const;

export type SpecialAction = (typeof SPECIAL_ACTIONS)[number];

export type Command =
  | { readonly type: PlayerAction | "check" }
  | { readonly type: "rewind"; readonly to: number }
  | { readonly type: "special"; readonly turn: number; readonly action: SpecialAction };

export const REJECT_REASONS = [
  "BATTLE_FINISHED",
  "CANNOT_CHECK_FIRST_TURN",
  "ALREADY_CHECKED",
  "CHECK_LIMIT",
  "NO_CHECKPOINT",
  "REWIND_LIMIT",
  "CANNOT_REWIND_HERE",
  "INVALID_REWIND_TARGET",
  "SPECIAL_UNAVAILABLE",
  "INVALID_SPECIAL_TARGET"
] as const;

export type RejectReason = (typeof REJECT_REASONS)[number];

export type PlayerSetup = {
  readonly hp: number;
  readonly attack: number;
  readonly defence: number;
  readonly attribute: Attribute;
  readonly attackBuffRate: number;
  readonly defenceBuffAmount: number;
  readonly checkMax: number;
  readonly rewindMax: number;
  readonly specialMax: number;
  readonly numbnessResistant: boolean;
};

export type EnemySetup = {
  readonly hp: number;
  readonly attack: number;
  readonly defence: number;
  readonly attribute: Attribute;
  readonly attackBuffRate: number;
  readonly defenceBuffAmount: number;
  readonly fixedAttackPower: number;
  readonly strongAttackPower: number;
  readonly recoveryRate: number;
  readonly changeAttribute: Attribute | null;
  readonly attackDebuff: number;
  readonly defenceDebuff: number;
  readonly turns: readonly EnemyAction[];
};

export type BattleSetup = {
  readonly seed: number;
  readonly player: PlayerSetup;
  readonly enemies: readonly [EnemySetup, ...EnemySetup[]];
};

export type Outcome = "ongoing" | "win" | "lose";

export type PlayerState = {
  readonly hp: number;
  readonly attackMultiplier: number;
  readonly defenceBuffCount: number;
};

export type EnemyState = {
  readonly setup: EnemySetup;
  readonly hp: number;
  readonly maxHp: number;
  readonly attribute: Attribute;
  readonly attackMultiplier: number;
  readonly defence: number;
  readonly provocation: number;
  readonly turns: readonly EnemyAction[];
};

export type BattleState = {
  readonly setup: BattleSetup;
  readonly stage: number;
  readonly turn: number;
  readonly outcome: Outcome;
  readonly player: PlayerState;
  readonly enemy: EnemyState;
  readonly checkpoints: readonly number[];
  readonly checkCount: number;
  readonly rewindCount: number;
  readonly specialCount: number;
  readonly numbnessTurns: number;
  readonly rngState: number;
};

export type BattleEvent =
  | { readonly type: "paralyzed" }
  | { readonly type: "defended" }
  | { readonly type: "defenceBuffed" }
  | { readonly type: "enemyAction"; readonly action: EnemyAction }
  | { readonly type: "playerDamaged"; readonly amount: number }
  | { readonly type: "enemyDamaged"; readonly amount: number }
  | { readonly type: "enemyRecovered"; readonly amount: number }
  | { readonly type: "attackBuffed" }
  | { readonly type: "enemyAttributeChanged"; readonly attribute: Attribute }
  | { readonly type: "numbed" }
  | { readonly type: "numbnessResisted" }
  | { readonly type: "checked"; readonly turn: number }
  | { readonly type: "rewound"; readonly turn: number }
  | { readonly type: "specialUsed"; readonly turn: number; readonly action: SpecialAction }
  | { readonly type: "stageChanged"; readonly stage: number }
  | { readonly type: "finished"; readonly outcome: Exclude<Outcome, "ongoing"> };

export type StepResult =
  | { readonly ok: true; readonly state: BattleState; readonly events: readonly BattleEvent[] }
  | { readonly ok: false; readonly reason: RejectReason };
