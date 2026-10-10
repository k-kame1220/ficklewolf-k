import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { createGuest } from "@/api/auth/auth.mutate";
import { ApiError, InvalidResponseError } from "@/api/core/apiError";
import { API_BASE_URL } from "@/api/core/config";
import { server } from "@/api/mocks/node";

import { fetchMyQuests } from "./quest.query";

describe("fetchMyQuests", () => {
  it("Lv1 のゲストは、メインクエスト A と今日のお天気クエストに挑戦できる", async () => {
    await createGuest({ name: "ゲスト" });

    const quests = await fetchMyQuests();

    expect([...quests.keys()]).toStrictEqual(["main-a", "weather-rain"]);
    expect(quests.get("main-a")).toStrictEqual({
      id: "main-a",
      kind: "main",
      name: "A",
      imageKey: "characters/a/main",
      attribute: "yang",
      stageCount: 1,
      turnCount: 10,
      revealCount: 1,
      isCleared: false
    });
  });

  it("トークンが無ければ 401 の ApiError", async () => {
    await expect(fetchMyQuests()).rejects.toBeInstanceOf(ApiError);
  });

  it("形が違えば InvalidResponseError", async () => {
    await createGuest({ name: "ゲスト" });
    server.use(http.get(`${API_BASE_URL}/me/quests`, () => HttpResponse.json({ quests: [{ id: "main-a" }] })));

    await expect(fetchMyQuests()).rejects.toBeInstanceOf(InvalidResponseError);
  });
});
