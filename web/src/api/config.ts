import * as v from "valibot";

const DEFAULT_API_BASE_URL = "http://localhost:8080";

const EnvSchema = v.object({
  VITE_API_BASE_URL: v.optional(v.pipe(v.string(), v.url()), DEFAULT_API_BASE_URL),
  VITE_API_MOCK: v.optional(v.picklist(["true", "false"]), "true")
});

const env = v.parse(EnvSchema, import.meta.env);

/** api の基点 URL（`VITE_API_BASE_URL`。未設定ならローカルの api） */
export const API_BASE_URL = env.VITE_API_BASE_URL;

/** 開発サーバーで MSW のモックを使うか（`VITE_API_MOCK=false` で本物の api につなぐ）。本番のビルドでは常に false */
export const isApiMockEnabled = import.meta.env.DEV && env.VITE_API_MOCK === "true";
