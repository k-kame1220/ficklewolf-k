import * as v from "valibot";

import { readStorage, removeStorage, STORAGE_KEYS, writeStorage } from "@/shared/storage/storage";

/** 端末に保存した認証トークンを読む。無ければ null */
export const readAuthToken = (): string | null => readStorage(STORAGE_KEYS.authToken, v.string());

/** 認証トークンを端末に保存する */
export const saveAuthToken = (token: string): void => {
  writeStorage(STORAGE_KEYS.authToken, token);
};

/** 端末の認証トークンを消す */
export const clearAuthToken = (): void => {
  removeStorage(STORAGE_KEYS.authToken);
};
