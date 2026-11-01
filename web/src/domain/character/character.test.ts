import { describe, expect, it } from "vitest";

import { remainingItemUses, statUpgrade } from "./character";

import type { MyCharacterModel, StatBreakdownModel } from "./character";

const breakdown = (item: number, duplicate: number, weather: number): StatBreakdownModel => ({
  base: 1000,
  bonus: { item, duplicate, weather },
  total: 1000 + item + duplicate + weather
});

const character = (itemUses: number, itemUseMax: number): MyCharacterModel => ({
  id: "zero",
  name: "ZERO",
  attribute: "moon",
  description: "",
  assets: { main: "", icon: "", home: "" },
  stats: { hp: breakdown(0, 0, 0), attack: breakdown(0, 0, 0), defence: breakdown(0, 0, 0) },
  itemUses: { hp: itemUses, attack: 0, defence: 0 },
  itemUseMax: { hp: itemUseMax, attack: 16, defence: 15 }
});

describe("statUpgrade", () => {
  it("アイテムと被りの分を足し、天気のボーナスは入れない", () => {
    expect(statUpgrade(breakdown(84, 14, 60))).toBe(98);
  });
});

describe("remainingItemUses", () => {
  it("上限から使った数を引く", () => {
    expect(remainingItemUses(character(3, 20), "hp")).toBe(17);
  });

  it("使い切ったら 0（上限を超えていても 0 未満にはしない）", () => {
    expect(remainingItemUses(character(20, 20), "hp")).toBe(0);
    expect(remainingItemUses(character(21, 20), "hp")).toBe(0);
  });
});
