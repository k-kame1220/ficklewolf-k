import type { Attribute } from "../attribute/attribute";

/** プレイヤーが選べる行動（ターンを進めるもの） */
export type PlayerActionCommand = "attack" | "defend" | "attackBuff" | "defenceBuff";

/** 敵の行動（`spec/battle/README.md` の名前） */
export type EnemyAction =
  | "attack"
  | "defend"
  | "attackBuff"
  | "defenceBuff"
  | "fixedAttack"
  | "strongAttack"
  | "concentration"
  | "deathblow"
  | "provocation"
  | "fullRecovery"
  | "rateRecovery"
  | "changeAttribute"
  | "numbness"
  | "attackDebuff"
  | "defenceDebuff";

/** 必殺技で書き換えられる行動 */
export type SpecialAction = "attack" | "defend" | "attackBuff" | "defenceBuff" | "provocation";

/** api に送るコマンド */
export type BattleCommand =
  | { readonly type: PlayerActionCommand | "check" }
  | { readonly type: "rewind"; readonly to: number }
  | { readonly type: "special"; readonly turn: number; readonly action: SpecialAction };

/** バトルの中のプレイヤー（api が計算した今の値） */
export type BattlePlayerModel = {
  readonly characterId: string;
  readonly name: string;
  readonly attribute: Attribute;
  /** 素材のキー */
  readonly assets: { readonly main: string; readonly icon: string; readonly home: string };
  readonly hp: number;
  readonly maxHp: number;
  /** 今の攻撃力（属性の倍率込み。攻撃倍率は含まない） */
  readonly attack: number;
  /** 今の防御力（防御バフ込み） */
  readonly defence: number;
  /** 攻撃倍率（1 から始まり、攻撃バフで増える） */
  readonly attackRate: number;
  /** ビリビリの残りターン数 */
  readonly numbnessTurns: number;
  readonly checkRemaining: number;
  readonly rewindRemaining: number;
  readonly specialRemaining: number;
  /** 今、必殺技の条件を満たしているか */
  readonly isSpecialAvailable: boolean;
};

/** バトルの中の敵（行動の並びは持たない） */
export type BattleEnemyModel = {
  readonly name: string;
  /** 敵の画像のキー */
  readonly imageKey: string;
  readonly attribute: Attribute;
  readonly hp: number;
  readonly maxHp: number;
};

/** 済んだターンの記録（ログ） */
export type BattleHistoryEntryModel = {
  readonly stage: number;
  readonly turn: number;
  /** プレイヤーの行動（チェックなどターンを進めない操作の記録では null） */
  readonly command: PlayerActionCommand | null;
  /** プレイヤーの行動がしびれて失敗したか */
  readonly isParalyzed: boolean;
  readonly enemyAction: EnemyAction;
};

/** バトルの今の状態（`Battle`）。画面はこれを表示するだけで、計算はしない */
export type BattleModel = {
  readonly id: string;
  readonly questId: string;
  /** 状態の番号。操作を送るときにそのまま付ける */
  readonly seq: number;
  /** `command`: コマンド待ち / `choosingSpecial`: 必殺技の書き換え待ち / `finished`: 決着 */
  readonly phase: "command" | "choosingSpecial" | "finished";
  readonly outcome: "ongoing" | "win" | "lose";
  /** 何体目の敵か */
  readonly stage: number;
  readonly stageCount: number;
  /** これから行うターンの番号 */
  readonly turn: number;
  /** 今の敵のターン数 */
  readonly turnCount: number;
  readonly player: BattlePlayerModel;
  readonly enemy: BattleEnemyModel;
  /** チェックしたターン */
  readonly checkpoints: readonly number[];
  readonly revealRemaining: number;
  readonly history: readonly BattleHistoryEntryModel[];
};

/** コマンドで起きたこと（画面はこれを順に演出する。HP は演出のあとの値） */
export type BattleEventModel =
  | {
      readonly type: "playerAction";
      readonly command: PlayerActionCommand;
      readonly isParalyzed: boolean;
      /** 敵に与えたダメージ */
      readonly damage: number;
      readonly playerHp: number;
      readonly enemyHp: number;
    }
  | {
      readonly type: "enemyAction";
      readonly action: EnemyAction;
      /** プレイヤーが受けたダメージ */
      readonly damage: number;
      readonly playerHp: number;
      readonly enemyHp: number;
    }
  | { readonly type: "stageCleared"; readonly nextStage: number }
  | { readonly type: "checked"; readonly turn: number }
  | { readonly type: "rewound"; readonly to: number }
  | { readonly type: "specialApplied"; readonly turn: number; readonly action: SpecialAction }
  | { readonly type: "finished"; readonly outcome: "win" | "lose" };

/** 勝ったときの報酬（api が付与済み） */
export type RewardModel = {
  /** 報酬を受け取ったあとの Lv */
  readonly level: number;
  readonly isLevelUp: boolean;
  readonly fudaGained: number;
  /** 初めて仲間になったキャラ。いなければ null */
  readonly recruitedCharacterId: string | null;
  /** 被りで上がったステータス。なければ null */
  readonly duplicate: { readonly characterId: string; readonly stat: "hp" | "attack" | "defence" } | null;
  readonly items: readonly { readonly itemId: string; readonly count: number }[];
};

/** コマンドを 1 つ実行した結果 */
export type BattleStepModel = {
  readonly events: readonly BattleEventModel[];
  readonly battle: BattleModel;
  /** このコマンドで勝ったときだけ入る */
  readonly reward: RewardModel | null;
};
