import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { InvalidResponseError } from "@/api/core/apiError";
import { API_BASE_URL } from "@/api/core/config";
import { server } from "@/api/mocks/node";

import { fetchMinAppVersion } from "./app.query";

describe("fetchMinAppVersion", () => {
  it("spec/master/settings.json の最低バージョンを返す", async () => {
    expect(await fetchMinAppVersion()).toBe("0.1.0");
  });

  it("形が違えば InvalidResponseError", async () => {
    server.use(http.get(`${API_BASE_URL}/app/version`, () => HttpResponse.json({ minAppVersion: "latest" })));

    await expect(fetchMinAppVersion()).rejects.toBeInstanceOf(InvalidResponseError);
  });
});
