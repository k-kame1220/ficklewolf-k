import { describe, expect, it } from "vitest";

import { remoteAssetUrl } from "./remoteAsset";

describe("remoteAssetUrl", () => {
  it("キーからハッシュ付きの名前の URL を作る", () => {
    expect(remoteAssetUrl("characters/zero/home")).toMatch(/^\/assets\/characters\/zero\/home\.[0-9a-f]{8}\.webp$/u);
  });

  it("一覧にないキーは null", () => {
    expect(remoteAssetUrl("characters/unknown/home")).toBeNull();
  });
});
