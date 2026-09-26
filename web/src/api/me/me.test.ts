import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { createGuest } from "@/api/auth/auth.mutate";
import { ApiError, InvalidResponseError } from "@/api/core/apiError";
import { readAuthToken, saveAuthToken } from "@/api/core/authToken";
import { API_BASE_URL } from "@/api/core/config";
import { server } from "@/api/mocks/node";

import { updateMe } from "./me.mutate";
import { fetchMe } from "./me.query";

describe("fetchMe", () => {
  it("保存したトークンで自分のプロフィールを取る", async () => {
    const created = await createGuest({ name: "ゲスト" });

    await expect(fetchMe()).resolves.toStrictEqual(created);
  });

  it("レスポンスの形が OpenAPI と違えば InvalidResponseError", async () => {
    await createGuest({ name: "ゲスト" });
    server.use(http.get(`${API_BASE_URL}/me`, () => HttpResponse.json({ id: "not-uuid", name: "ゲスト" })));

    await expect(fetchMe()).rejects.toBeInstanceOf(InvalidResponseError);
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
    await createGuest({ name: "ゲスト" });

    const updated = await updateMe({ name: "ウルフ" });

    expect(updated.name).toBe("ウルフ");
    await expect(fetchMe()).resolves.toStrictEqual(updated);
  });

  it("持っているキャラを出撃キャラにできる", async () => {
    await createGuest({ name: "ゲスト" });

    await expect(updateMe({ selectedCharacterId: "zero" })).resolves.toMatchObject({ selectedCharacterId: "zero" });
  });

  it("持っていないキャラは CHARACTER_NOT_OWNED", async () => {
    await createGuest({ name: "ゲスト" });

    await expect(updateMe({ selectedCharacterId: "a" })).rejects.toStrictEqual(
      new ApiError(400, "CHARACTER_NOT_OWNED")
    );
  });

  it("変える項目が無ければ VALIDATION_FAILED", async () => {
    await createGuest({ name: "ゲスト" });

    await expect(updateMe({})).rejects.toStrictEqual(new ApiError(400, "VALIDATION_FAILED"));
  });

  it("名前が空なら INVALID_NAME", async () => {
    await createGuest({ name: "ゲスト" });

    await expect(updateMe({ name: "  " })).rejects.toStrictEqual(new ApiError(400, "INVALID_NAME"));
  });
});
