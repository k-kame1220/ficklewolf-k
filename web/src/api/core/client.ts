import createClient from "openapi-fetch";

import type { paths } from "@/api/generated/schema";

import { clearAuthToken, readAuthToken } from "./authToken";
import { API_BASE_URL } from "./config";

const HTTP_UNAUTHORIZED = 401;

/**
 * api のクライアント。端末に認証トークンがあれば `Authorization: Bearer` を付ける。
 * 401 が返ったらトークンは無効なので端末から消す。
 * `fetch` は呼ぶたびに取り出す（MSW が後から差し替える `fetch` を使うため）。
 */
export const apiClient = createClient<paths>({ baseUrl: API_BASE_URL, fetch: request => globalThis.fetch(request) });

apiClient.use({
  onRequest: ({ request }) => {
    const token = readAuthToken();
    if (token === null) return undefined;
    request.headers.set("Authorization", `Bearer ${token}`);
    return request;
  },
  onResponse: ({ response }) => {
    if (response.status === HTTP_UNAUTHORIZED) clearAuthToken();
    return undefined;
  }
});
