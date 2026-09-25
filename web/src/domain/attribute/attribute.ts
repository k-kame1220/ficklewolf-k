export const ATTRIBUTES = ["YANG", "NOTE", "MOON"] as const;

export type Attribute = (typeof ATTRIBUTES)[number];

const ADVANTAGE = new Map<Attribute, Attribute>([
  ["YANG", "NOTE"],
  ["NOTE", "MOON"],
  ["MOON", "YANG"]
]);

export const ADVANTAGE_MULTIPLIER = 1.25;
export const DISADVANTAGE_MULTIPLIER = 0.75;
export const NEUTRAL_MULTIPLIER = 1;

export const attackMultiplier = (attacker: Attribute, defender: Attribute): number => {
  if (ADVANTAGE.get(attacker) === defender) return ADVANTAGE_MULTIPLIER;
  if (ADVANTAGE.get(defender) === attacker) return DISADVANTAGE_MULTIPLIER;
  return NEUTRAL_MULTIPLIER;
};
