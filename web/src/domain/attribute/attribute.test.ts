import { describe, expect, it } from "vitest";

import { attackMultiplier } from "./attribute";

describe("attackMultiplier", () => {
  it.each([
    ["yang", "note", 1.25],
    ["note", "moon", 1.25],
    ["moon", "yang", 1.25],
    ["note", "yang", 0.75],
    ["moon", "note", 0.75],
    ["yang", "moon", 0.75],
    ["yang", "yang", 1],
    ["note", "note", 1],
    ["moon", "moon", 1]
  ] as const)("%s が %s を攻撃すると ×%d", (attacker, defender, expected) => {
    expect(attackMultiplier(attacker, defender)).toBe(expected);
  });
});
