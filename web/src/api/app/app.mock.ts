import { http, HttpResponse } from "msw";
import * as v from "valibot";

import { API_BASE_URL } from "@/api/core/config";
import type { components } from "@/api/generated/schema";

const settingsRaw =
  Object.values(
    import.meta.glob<string>("../../../../spec/master/settings.json", { eager: true, query: "?raw", import: "default" })
  )[0] ?? "null";

const SettingsSchema = v.object({ minAppVersion: v.string() });

/** `GET /app/version` のモック。spec/master/settings.json の `minAppVersion` を返す */
export const createAppMockHandlers = () => {
  const settings = v.parse(SettingsSchema, JSON.parse(settingsRaw));
  return [
    http.get(`${API_BASE_URL}/app/version`, () =>
      HttpResponse.json({ minAppVersion: settings.minAppVersion } satisfies components["schemas"]["AppVersion"], {
        headers: { "Cache-Control": "no-store" }
      })
    )
  ];
};
