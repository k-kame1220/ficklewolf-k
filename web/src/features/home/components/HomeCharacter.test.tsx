import { screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { createGuest } from "@/api/auth/auth.mutate";
import { API_BASE_URL } from "@/api/core/config";
import { server } from "@/api/mocks/node";
import { renderWithQueryClient } from "@/test/render";

import HomeCharacter from "./HomeCharacter";

describe("HomeCharacter", () => {
  it("出撃キャラのホームの絵を出す", async () => {
    await createGuest({ name: "ゲスト" });

    renderWithQueryClient(<HomeCharacter />);

    const image = await screen.findByRole("img", { name: "ZERO" });
    expect(image).toHaveAttribute(
      "src",
      expect.stringMatching(/^\/assets\/characters\/zero\/home\.[0-9a-f]{8}\.webp$/u)
    );
  });

  it("通信に失敗したらメッセージを出し、リトライで取り直す", async () => {
    await createGuest({ name: "ゲスト" });
    server.use(http.get(`${API_BASE_URL}/me`, () => HttpResponse.error(), { once: true }));

    renderWithQueryClient(<HomeCharacter />);

    expect(await screen.findByRole("alert")).toHaveTextContent("通信エラーが発生しました。");
    await userEvent.click(screen.getByRole("button", { name: "リトライ" }));
    expect(await screen.findByRole("img", { name: "ZERO" })).toBeInTheDocument();
  });
});
