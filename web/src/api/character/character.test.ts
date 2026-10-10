import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { createGuest } from "@/api/auth/auth.mutate";
import { ApiError, InvalidResponseError } from "@/api/core/apiError";
import { API_BASE_URL } from "@/api/core/config";
import { server } from "@/api/mocks/node";

import { fetchMyCharacters } from "./character.query";

describe("fetchMyCharacters", () => {
  it("作ったばかりのゲストは最初のキャラ（ZERO）だけを持っている", async () => {
    await createGuest({ name: "ゲスト" });

    const characters = await fetchMyCharacters();

    expect([...characters.keys()]).toStrictEqual(["zero"]);
    expect(characters.get("zero")?.name).toBe("ZERO");
    expect(characters.get("zero")?.assets.home).toBe("characters/zero/home");
  });

  it("トークンが無ければ 401 の ApiError", async () => {
    await expect(fetchMyCharacters()).rejects.toBeInstanceOf(ApiError);
  });

  it("形が違えば InvalidResponseError", async () => {
    await createGuest({ name: "ゲスト" });
    server.use(http.get(`${API_BASE_URL}/me/characters`, () => HttpResponse.json({ characters: [{ id: "zero" }] })));

    await expect(fetchMyCharacters()).rejects.toBeInstanceOf(InvalidResponseError);
  });
});
