import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { createGuest } from "@/api/auth/auth.mutate";
import { ApiError, InvalidResponseError } from "@/api/core/apiError";
import { API_BASE_URL } from "@/api/core/config";
import { server } from "@/api/mocks/node";

import { fetchTodayWeather } from "./weather.query";

describe("fetchTodayWeather", () => {
  it("今日の天気（モックは雨）を取る", async () => {
    await createGuest({ name: "ゲスト" });

    const weather = await fetchTodayWeather();

    expect(weather.date).toMatch(/^\d{4}-\d{2}-\d{2}$/u);
    expect({ id: weather.id, name: weather.name, attribute: weather.attribute }).toStrictEqual({
      id: "rain",
      name: "雨",
      attribute: "note"
    });
  });

  it("トークンが無ければ 401 の ApiError", async () => {
    await expect(fetchTodayWeather()).rejects.toBeInstanceOf(ApiError);
  });

  it("形が違えば InvalidResponseError", async () => {
    await createGuest({ name: "ゲスト" });
    server.use(http.get(`${API_BASE_URL}/weather/today`, () => HttpResponse.json({ id: "rain" })));

    await expect(fetchTodayWeather()).rejects.toBeInstanceOf(InvalidResponseError);
  });
});
