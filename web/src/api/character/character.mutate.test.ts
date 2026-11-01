import { describe, expect, it } from "vitest";

import { createGuest } from "@/api/auth/auth.mutate";
import { ApiError } from "@/api/core/apiError";
import { fetchMyItems } from "@/api/item/item.query";

import { enhanceCharacter } from "./character.mutate";

const NONE = { hp: 0, attack: 0, defence: 0 };

describe("enhanceCharacter", () => {
  it("アイテムを使うと、強化したあとのキャラが返り、アイテムが減る", async () => {
    await createGuest({ name: "ゲスト" });

    const character = await enhanceCharacter({ characterId: "zero", counts: { ...NONE, hp: 2 } });

    expect(character.itemUses).toStrictEqual({ hp: 2, attack: 0, defence: 0 });
    expect(character.stats.hp.bonus.item).toBe(84);
    expect(character.stats.hp.total).toBe(character.stats.hp.base + 84);
    expect((await fetchMyItems()).map(item => item.count)).toStrictEqual([1, 3, 3]);
  });

  it("アイテムが足りなければ ITEM_NOT_ENOUGH で、何も減らない", async () => {
    await createGuest({ name: "ゲスト" });

    await expect(enhanceCharacter({ characterId: "zero", counts: { ...NONE, attack: 4 } })).rejects.toMatchObject({
      code: "ITEM_NOT_ENOUGH"
    });
    expect((await fetchMyItems()).map(item => item.count)).toStrictEqual([3, 3, 3]);
  });

  it("持っていないキャラは CHARACTER_NOT_OWNED", async () => {
    await createGuest({ name: "ゲスト" });

    await expect(enhanceCharacter({ characterId: "a", counts: { ...NONE, hp: 1 } })).rejects.toMatchObject({
      code: "CHARACTER_NOT_OWNED"
    });
  });

  it("全部 0 なら VALIDATION_FAILED", async () => {
    await createGuest({ name: "ゲスト" });

    await expect(enhanceCharacter({ characterId: "zero", counts: NONE })).rejects.toBeInstanceOf(ApiError);
  });
});
