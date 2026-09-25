import { describe, expect, it } from "vitest";

import { attackMultiplier } from "./attribute";

describe("attackMultiplier", () => {
  it.each([
    ["YANG", "NOTE", 1.25],
    ["NOTE", "MOON", 1.25],
    ["MOON", "YANG", 1.25],
    ["NOTE", "YANG", 0.75],
    ["MOON", "NOTE", 0.75],
    ["YANG", "MOON", 0.75],
    ["YANG", "YANG", 1],
    ["NOTE", "NOTE", 1],
    ["MOON", "MOON", 1]
  ] as const)("%s が %s を攻撃すると ×%d", (attacker, defender, expected) => {
    expect(attackMultiplier(attacker, defender)).toBe(expected);
  });
});
