import { describe, expect, it, vi } from "vitest";

import { saveAuthToken } from "@/api/core/authToken";
import { updateMe } from "@/api/me/me.mutate";
import { meQueryOptions } from "@/api/me/me.query";

import { createAppQueryClient } from "./queryClient";

describe("createAppQueryClient", () => {
  it("クエリが 401 になったら onUnauthorized を呼ぶ", async () => {
    const onUnauthorized = vi.fn();
    const queryClient = createAppQueryClient(onUnauthorized);
    saveAuthToken("unknown-token");

    await expect(queryClient.query(meQueryOptions)).rejects.toThrow();

    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it("変更が 401 になったら onUnauthorized を呼ぶ", async () => {
    const onUnauthorized = vi.fn();
    const queryClient = createAppQueryClient(onUnauthorized);

    await expect(
      queryClient.getMutationCache().build(queryClient, { mutationFn: updateMe }).execute({ name: "ウルフ" })
    ).rejects.toThrow();

    expect(onUnauthorized).toHaveBeenCalledOnce();
  });
});
