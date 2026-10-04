import { describe, expect, it } from "vitest";

import { isUpdateRequired } from "./version";

describe("isUpdateRequired", () => {
  it.each([
    { app: "0.1.0", min: "0.1.0", required: false },
    { app: "0.2.0", min: "0.1.0", required: false },
    { app: "1.0.0", min: "0.9.9", required: false },
    { app: "0.1.0", min: "0.1.1", required: true },
    { app: "0.1.9", min: "0.2.0", required: true },
    { app: "0.10.0", min: "0.9.0", required: false },
    { app: "1.2.3", min: "2.0.0", required: true }
  ])("アプリ $app・最低 $min → $required", ({ app, min, required }) => {
    expect(isUpdateRequired(app, min)).toBe(required);
  });
});
