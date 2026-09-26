/** 属性（陽・音・月）。陽 > 音 > 月 > 陽 の順に有利 */
export const ATTRIBUTES = ["yang", "note", "moon"] as const;

/** 属性（陽・音・月） */
export type Attribute = (typeof ATTRIBUTES)[number];

const ADVANTAGE = new Map<Attribute, Attribute>([
  ["yang", "note"],
  ["note", "moon"],
  ["moon", "yang"]
]);

export const ADVANTAGE_MULTIPLIER = 1.25;
export const DISADVANTAGE_MULTIPLIER = 0.75;
export const NEUTRAL_MULTIPLIER = 1;

/** 攻撃する側の攻撃力に掛ける属性の倍率（有利 1.25・不利 0.75・同じ 1） */
export const attackMultiplier = (attacker: Attribute, defender: Attribute): number => {
  if (ADVANTAGE.get(attacker) === defender) return ADVANTAGE_MULTIPLIER;
  if (ADVANTAGE.get(defender) === attacker) return DISADVANTAGE_MULTIPLIER;
  return NEUTRAL_MULTIPLIER;
};
