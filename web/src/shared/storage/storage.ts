import * as v from "valibot";

/** 端末に保存する値のキー */
export const STORAGE_KEYS = {
  authToken: "k.authToken"
} as const;

/** 端末に保存する値のキー */
export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

/** 端末に保存した値を読む。無い・読めない・`schema` に合わないときは null */
export const readStorage = <T>(key: StorageKey, schema: v.GenericSchema<unknown, T>): T | null => {
  const raw = (() => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  })();
  if (raw === null) return null;

  try {
    const value: unknown = JSON.parse(raw);
    const result = v.safeParse(schema, value);
    return result.success ? result.output : null;
  } catch {
    return null;
  }
};

/** 端末に値を保存する（JSON にして保存する）。保存できない環境では何もしない */
export const writeStorage = (key: StorageKey, value: unknown): void => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    return;
  }
};

/** 端末に保存した値を消す */
export const removeStorage = (key: StorageKey): void => {
  try {
    window.localStorage.removeItem(key);
  } catch {
    return;
  }
};
