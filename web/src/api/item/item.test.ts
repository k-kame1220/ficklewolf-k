import { describe, expect, it } from "vitest";

import { createGuest } from "@/api/auth/auth.mutate";
import { ApiError } from "@/api/core/apiError";

import { fetchMyItems } from "./item.query";

describe("fetchMyItems", () => {
  it("作ったばかりのゲストは、最初のアイテム（月の酒 3 種を 3 個ずつ）を持っている", async () => {
    await createGuest({ name: "ゲスト" });

    const items = await fetchMyItems();

    expect(items.map(item => [item.id, item.count])).toStrictEqual([
      ["moon-hp", 3],
      ["moon-attack", 3],
      ["moon-defence", 3]
    ]);
    expect(items[0]?.iconKey).toBe("items/moon-hp");
  });

  it("トークンが無ければ 401 の ApiError", async () => {
    await expect(fetchMyItems()).rejects.toBeInstanceOf(ApiError);
  });
});
