/** 強化できるステータス（HP・攻撃力・防御力）。スピードはフェーズ 2 */
export const STATS = ["hp", "attack", "defence"] as const;

/** 強化できるステータス */
export type Stat = (typeof STATS)[number];

/** ステータスの名前（旧作の表示） */
export const STAT_NAMES = {
  hp: "HP",
  attack: "攻撃力",
  defence: "防御力"
} as const satisfies Record<Stat, string>;
