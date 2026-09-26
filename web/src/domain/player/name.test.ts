import { describe, expect, it } from "vitest";

import { normalizePlayerName } from "./name";

describe("normalizePlayerName", () => {
  it.each([
    { raw: "ゲスト", name: "ゲスト" },
    { raw: "  あいうえお  ", name: "あいうえお" },
    { raw: "abcdef", name: "abcdef" },
    { raw: "🐺🐺🐺🐺🐺🐺", name: "🐺🐺🐺🐺🐺🐺" },
    { raw: "K 2", name: "K 2" }
  ])("$raw は $name として使える", ({ raw, name }) => {
    expect(normalizePlayerName(raw)).toStrictEqual({ ok: true, name });
  });

  it.each([
    { raw: "", reason: "EMPTY" },
    { raw: "   ", reason: "EMPTY" },
    { raw: "abcdefg", reason: "TOO_LONG" },
    { raw: "🐺🐺🐺🐺🐺🐺🐺", reason: "TOO_LONG" },
    { raw: "a\u0000b", reason: "CONTROL_CHARACTER" },
    { raw: "a\nb", reason: "CONTROL_CHARACTER" }
  ])("$raw は $reason で使えない", ({ raw, reason }) => {
    expect(normalizePlayerName(raw)).toStrictEqual({ ok: false, reason });
  });
});
