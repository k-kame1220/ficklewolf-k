import { describe, expect, it } from "vitest";

import { ApiError } from "./apiError";
import { createGuest } from "./auth.mutate";
import { readAuthToken } from "./authToken";

describe("createGuest", () => {
  it("ゲストを作り、トークンを端末に保存する", async () => {
    const me = await createGuest({ name: "  ゲスト  " });

    expect(me).toStrictEqual({
      id: me.id,
      name: "ゲスト",
      level: 1,
      fuda: 0,
      selectedCharacterId: "zero"
    });
    expect(me.id).not.toBe("");
    expect(readAuthToken()).not.toBeNull();
  });

  it("名前が 7 文字なら INVALID_NAME で、トークンは保存しない", async () => {
    await expect(createGuest({ name: "abcdefg" })).rejects.toStrictEqual(new ApiError(400, "INVALID_NAME"));
    expect(readAuthToken()).toBeNull();
  });
});
