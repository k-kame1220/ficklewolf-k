import * as v from "valibot";
import { afterEach, describe, expect, it } from "vitest";

import { readStorage, removeStorage, STORAGE_KEYS, writeStorage } from "./storage";

describe("storage", () => {
  afterEach(() => {
    removeStorage(STORAGE_KEYS.authToken);
  });

  it("保存した値を読める", () => {
    writeStorage(STORAGE_KEYS.authToken, "token-1");

    expect(readStorage(STORAGE_KEYS.authToken, v.string())).toBe("token-1");
  });

  it("保存していなければ null", () => {
    expect(readStorage(STORAGE_KEYS.authToken, v.string())).toBeNull();
  });

  it("消したら null", () => {
    writeStorage(STORAGE_KEYS.authToken, "token-1");
    removeStorage(STORAGE_KEYS.authToken);

    expect(readStorage(STORAGE_KEYS.authToken, v.string())).toBeNull();
  });

  it("形が違う値は null", () => {
    writeStorage(STORAGE_KEYS.authToken, 123);

    expect(readStorage(STORAGE_KEYS.authToken, v.string())).toBeNull();
  });

  it("JSON として読めない値は null", () => {
    window.localStorage.setItem(STORAGE_KEYS.authToken, "{broken");

    expect(readStorage(STORAGE_KEYS.authToken, v.string())).toBeNull();
  });
});
