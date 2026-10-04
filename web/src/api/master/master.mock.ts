import { http, HttpResponse } from "msw";
import * as v from "valibot";

import { API_BASE_URL } from "@/api/core/config";

const HTTP_NOT_MODIFIED = 304;
const VERSION_LENGTH = 16;
const HEX_RADIX = 16;
const HEX_BYTE_LENGTH = 2;
const MASTER_FILE_NAMES = ["attributes", "characters", "items", "quests", "settings", "weathers"] as const;

const rawFiles = import.meta.glob<string>("../../../../spec/master/*.json", {
  eager: true,
  query: "?raw",
  import: "default"
});
const rawFileByName = new Map(
  Object.entries(rawFiles).map(([path, content]) => [path.split("/").at(-1)?.replace(".json", "") ?? path, content])
);
const readRawFile = (name: (typeof MASTER_FILE_NAMES)[number]): string => rawFileByName.get(name) ?? "null";

const SettingsSchema = v.object({ minAppVersion: v.string() });

/** spec/tools/validate.py の master_version と同じ計算（ファイル名と改行・中身の順に SHA-256 の先頭 16 文字） */
const computeMasterVersion = async (): Promise<string> => {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(MASTER_FILE_NAMES.map(name => `${name}.json\n${readRawFile(name)}`).join(""));
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return [...digest]
    .map(byte => byte.toString(HEX_RADIX).padStart(HEX_BYTE_LENGTH, "0"))
    .join("")
    .slice(0, VERSION_LENGTH);
};

/** `GET /master/version`・`GET /master` のモック。中身は spec/master の JSON をそのまま返す */
export const createMasterMockHandlers = () => {
  const masterVersion = computeMasterVersion();
  const settings = v.parse(SettingsSchema, JSON.parse(readRawFile("settings")));

  return [
    http.get(`${API_BASE_URL}/master/version`, async () =>
      HttpResponse.json(
        { masterVersion: await masterVersion, minAppVersion: settings.minAppVersion },
        { headers: { "Cache-Control": "no-store" } }
      )
    ),

    http.get(`${API_BASE_URL}/master`, async ({ request }) => {
      const version = await masterVersion;
      const etag = `"${version}"`;
      if (request.headers.get("If-None-Match") === etag) {
        return new HttpResponse(null, { status: HTTP_NOT_MODIFIED, headers: { ETag: etag } });
      }

      const files = MASTER_FILE_NAMES.map(name => `"${name}":${readRawFile(name)}`).join(",");
      return new HttpResponse(`{"version":"${version}",${files}}`, {
        headers: { "Content-Type": "application/json", ETag: etag, "Cache-Control": "no-cache" }
      });
    })
  ];
};
