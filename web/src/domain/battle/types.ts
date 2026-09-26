import type { Attribute } from "../attribute/attribute";

/** 敵の行動の一覧。意味は spec/battle/README.md「敵の値と行動」 */
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

/** 敵の行動 */
export type EnemyAction = (typeof ENEMY_ACTIONS)[number];

/** ターンを消費するプレイヤーの行動 */
export const PLAYER_ACTIONS = ["attack", "defend", "attackBuff", "defenceBuff"] as const;

/** ターンを消費するプレイヤーの行動。`defend` / `defenceBuff` は敵より先、`attack` / `attackBuff` は敵の後に行う */
export type PlayerAction = (typeof PLAYER_ACTIONS)[number];

/** 必殺技で敵の行動を書き換えられる先 */
export const SPECIAL_ACTIONS = ["attack", "defend", "attackBuff", "defenceBuff", "provocation"] as const;

/** 必殺技で敵の行動を書き換えられる先 */
export type SpecialAction = (typeof SPECIAL_ACTIONS)[number];

/** プレイヤーが入力する 1 コマンド。`check` / `rewind` / `special` はターンを消費しない */
export type Command =
  | { readonly type: PlayerAction | "check" }
  | {
      readonly type: "rewind";
      /** 戻り先のターン（チェックポイントのどれか） */
      readonly to: number;
    }
  | {
      readonly type: "special";
      /** 書き換える敵の行動のターン（今のターンの ±2 以内） */
      readonly turn: number;
      readonly action: SpecialAction;
    };

/** コマンドを実行できない理由。複数に当てはまるときはこの並びの先頭のものを返す */
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

/** コマンドを実行できない理由 */
export type RejectReason = (typeof REJECT_REASONS)[number];

/** バトル開始時に確定したプレイヤーのステータス（天気・育成を反映済み）。バトル中は変わらない */
export type PlayerSetup = {
  /** 最大 HP */
  readonly hp: number;
  readonly attack: number;
  readonly defence: number;
  readonly attribute: Attribute;
  /** 攻撃バフ 1 回で攻撃倍率に足す値 */
  readonly attackBuffRate: number;
  /** 防御バフ 1 回で防御力に足す値 */
  readonly defenceBuffAmount: number;
  /** チェックできる回数（リターンするとリセット） */
  readonly checkMax: number;
  /** バトル全体でリターンできる回数 */
  readonly rewindMax: number;
  /** バトル全体で必殺技を使える回数 */
  readonly specialMax: number;
  /** true ならビリビリを受けない */
  readonly numbnessResistant: boolean;
};

/** 敵 1 体の初期値と行動の並び。spec/master のクエストの `stages[].battle` と同じ形 */
export type EnemySetup = {
  /** 最大 HP の初期値 */
  readonly hp: number;
  readonly attack: number;
  readonly defence: number;
  /** 元の属性 */
  readonly attribute: Attribute;
  /** `attackBuff` 1 回で敵の攻撃倍率に足す値 */
  readonly attackBuffRate: number;
  /** `defenceBuff` 1 回で敵の防御力に足す値 */
  readonly defenceBuffAmount: number;
  /** `fixedAttack` のダメージ（防御は効かない） */
  readonly fixedAttackPower: number;
  /** `strongAttack` の攻撃力（属性・攻撃倍率は掛けない） */
  readonly strongAttackPower: number;
  /** `rateRecovery` で回復する最大 HP の割合 */
  readonly recoveryRate: number;
  /** `changeAttribute` で元の属性と切り替える属性。null なら属性は変わらない */
  readonly changeAttribute: Attribute | null;
  /** `attackDebuff` 1 回でプレイヤーの攻撃倍率から引く値 */
  readonly attackDebuff: number;
  /** `defenceDebuff` 1 回でプレイヤーの防御バフの回数から引く値 */
  readonly defenceDebuff: number;
  /** ターンごとの行動（先頭が 1 ターン目）。最後は `deathblow` */
  readonly turns: readonly EnemyAction[];
};

/** バトルを始めるのに必要なすべての値。サーバがクエスト開始時に確定して返す */
export type BattleSetup = {
  /** 乱数のシード（32 bit 整数） */
  readonly seed: number;
  readonly player: PlayerSetup;
  /** 戦う敵の順番。2 体以上なら連戦 */
  readonly enemies: readonly [EnemySetup, ...EnemySetup[]];
};

/** 決着。`ongoing` は決着前 */
export type Outcome = "ongoing" | "win" | "lose";

/** バトル中に変わるプレイヤーの値。連戦・リターンでも引き継ぐ */
export type PlayerState = {
  readonly hp: number;
  /** 攻撃力に掛ける倍率。1 から始まり、攻撃バフで増え、攻撃デバフで減る（0 未満にならない） */
  readonly attackMultiplier: number;
  /** 防御バフの回数。防御デバフで負の値になることがある（防御力は 0 未満にならない） */
  readonly defenceBuffCount: number;
};

/** バトル中に変わる今の敵の値。連戦で次の敵に入れ替わるとリセットする */
export type EnemyState = {
  readonly setup: EnemySetup;
  readonly hp: number;
  /** 最大 HP。`rateRecovery` で超えた分だけ増える */
  readonly maxHp: number;
  /** 今の属性。`changeAttribute` で切り替わる */
  readonly attribute: Attribute;
  /** 敵の攻撃力に掛ける倍率。1 から始まり、`attackBuff` で増える */
  readonly attackMultiplier: number;
  /** 防御バフを反映した防御力（`defend` の一時的な変化は含まない） */
  readonly defence: number;
  /** 挑発で攻撃力に足す値。属性変化でも消えない */
  readonly provocation: number;
  /** 今の行動の並び。必殺技で書き換えた結果を含み、リターンしても戻らない */
  readonly turns: readonly EnemyAction[];
};

/** バトル 1 回分の状態。`step` で新しい状態を作り、書き換えない */
export type BattleState = {
  readonly setup: BattleSetup;
  /** 何体目の敵か（1 始まり） */
  readonly stage: number;
  /** これから行うターンの番号（1 始まり）。リターンで戻り、次の敵に変わると 1 に戻る */
  readonly turn: number;
  readonly outcome: Outcome;
  readonly player: PlayerState;
  readonly enemy: EnemyState;
  /** チェックしたターンの番号（チェックした順）。リターン・次の敵でリセット */
  readonly checkpoints: readonly number[];
  /** チェックした回数。リターン・次の敵でリセット */
  readonly checkCount: number;
  /** バトル全体でリターンした回数 */
  readonly rewindCount: number;
  /** バトル全体で必殺技を使った回数 */
  readonly specialCount: number;
  /** ビリビリの残りターン数。リターンでも戻らない */
  readonly numbnessTurns: number;
  /** 乱数の内部状態。乱数を引くたびに進む */
  readonly rngState: number;
};

/**
 * 1 コマンドの中で起きたこと。起きた順に並べて返すので、画面はこの順に演出する。
 * `paralyzed` はしびれてプレイヤーの行動が行われなかったこと。`amount` は HP に反映した量（切り捨て後）。
 */
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

/** `step` の結果。実行できなかったときは理由だけを返し、状態は変わらない */
export type StepResult =
  | { readonly ok: true; readonly state: BattleState; readonly events: readonly BattleEvent[] }
  | { readonly ok: false; readonly reason: RejectReason };
