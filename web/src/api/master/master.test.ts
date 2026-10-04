import { http, HttpResponse } from "msw";
import { describe, expect, inject, it } from "vitest";

import { InvalidResponseError } from "@/api/core/apiError";
import { API_BASE_URL } from "@/api/core/config";
import { server } from "@/api/mocks/node";

import { fetchMaster, fetchMasterVersion } from "./master.query";

describe("fetchMasterVersion", () => {
  it("モックのバージョンは spec/tools/validate.py と同じ計算になる", async () => {
    const version = await fetchMasterVersion();

    expect(version.masterVersion).toBe(inject("specMasterVersion"));
    expect(version.minAppVersion).toMatch(/^\d+\.\d+\.\d+$/u);
  });
});

describe("fetchMaster", () => {
  it("spec/master の実データが通り、ID で引ける", async () => {
    const master = await fetchMaster();

    expect(master.version).toBe((await fetchMasterVersion()).masterVersion);
    expect(master.characters.get("zero")?.name).toBe("ZERO");
    expect(master.characters.size).toBe(38);
    expect(master.quests.size).toBe(42);
    expect(master.weathers.size).toBe(12);
    expect(master.items.size).toBe(9);
    expect(master.attributes.get("yang")?.strongAgainst).toBe("note");
    expect(master.settings.starterCharacterId).toBe("zero");
  });

  it("お天気クエストでないクエストの weatherId は null", async () => {
    const master = await fetchMaster();

    expect(master.quests.get("main-a")?.weatherId).toBeNull();
    expect(master.quests.get("weather-blue-sky")?.weatherId).toBe("blue-sky");
  });

  it("マスタの形が違えば InvalidResponseError", async () => {
    server.use(
      http.get(`${API_BASE_URL}/master`, () => HttpResponse.json({ version: "0000000000000000", characters: [] }))
    );

    await expect(fetchMaster()).rejects.toBeInstanceOf(InvalidResponseError);
  });
});

describe("GET /master のモック", () => {
  it("ETag と同じ If-None-Match には本文なしの 304 を返す", async () => {
    const first = await fetch(`${API_BASE_URL}/master`);
    const etag = first.headers.get("ETag");

    const second = await fetch(`${API_BASE_URL}/master`, { headers: { "If-None-Match": etag ?? "" } });

    expect(etag).toMatch(/^"[0-9a-f]{16}"$/u);
    expect(first.headers.get("Cache-Control")).toBe("no-cache");
    expect(second.status).toBe(304);
  });
});
