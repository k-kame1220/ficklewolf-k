import { describe, expect, it } from "vitest";

import { ApiError } from "./apiError";
import { createGuest } from "./auth.mutate";
import { readAuthToken, saveAuthToken } from "./authToken";
import { updateMe } from "./me.mutate";
import { fetchMe } from "./me.query";

describe("fetchMe", () => {
  it("保存したトークンで自分のプロフィールを取る", async () => {
    const created = await createGuest("ゲスト");

    await expect(fetchMe()).resolves.toStrictEqual(created);
  });

  it("トークンが無ければ UNAUTHORIZED", async () => {
    await expect(fetchMe()).rejects.toStrictEqual(new ApiError(401, "UNAUTHORIZED"));
  });

  it("無効なトークンは 401 で端末から消える", async () => {
    saveAuthToken("unknown-token");

    await expect(fetchMe()).rejects.toStrictEqual(new ApiError(401, "UNAUTHORIZED"));
    expect(readAuthToken()).toBeNull();
  });
});

describe("updateMe", () => {
  it("名前を変える", async () => {
    await createGuest("ゲスト");

    const updated = await updateMe({ name: "ウルフ" });

    expect(updated.name).toBe("ウルフ");
    await expect(fetchMe()).resolves.toStrictEqual(updated);
  });

  it("持っているキャラを出撃キャラにできる", async () => {
    await createGuest("ゲスト");

    await expect(updateMe({ selectedCharacterId: "zero" })).resolves.toMatchObject({ selectedCharacterId: "zero" });
  });

  it("持っていないキャラは CHARACTER_NOT_OWNED", async () => {
    await createGuest("ゲスト");

    await expect(updateMe({ selectedCharacterId: "a" })).rejects.toStrictEqual(
      new ApiError(400, "CHARACTER_NOT_OWNED")
    );
  });

  it("変える項目が無ければ VALIDATION_FAILED", async () => {
    await createGuest("ゲスト");

    await expect(updateMe({})).rejects.toStrictEqual(new ApiError(400, "VALIDATION_FAILED"));
  });

  it("名前が空なら INVALID_NAME", async () => {
    await createGuest("ゲスト");

    await expect(updateMe({ name: "  " })).rejects.toStrictEqual(new ApiError(400, "INVALID_NAME"));
  });
});
