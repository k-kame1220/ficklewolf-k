import { screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { createGuest } from "@/api/auth/auth.mutate";
import { API_BASE_URL } from "@/api/core/config";
import { server } from "@/api/mocks/node";
import { renderWithQueryClient } from "@/test/render";

import HomeProfile from "./HomeProfile";

describe("HomeProfile", () => {
  it("名前・Lv・お札・出撃キャラを表示する", async () => {
    await createGuest({ name: "ゲスト" });

    renderWithQueryClient(<HomeProfile />);

    expect(await screen.findByText("ゲスト")).toBeInTheDocument();
    expect(screen.getByText("Lv 1")).toBeInTheDocument();
    expect(screen.getByText("お札 0")).toBeInTheDocument();
    expect(screen.getByText("zero")).toBeInTheDocument();
  });

  it("通信に失敗したらメッセージを出し、リトライで取り直す", async () => {
    await createGuest({ name: "ゲスト" });
    server.use(http.get(`${API_BASE_URL}/me`, () => HttpResponse.error(), { once: true }));

    renderWithQueryClient(<HomeProfile />);

    expect(await screen.findByRole("alert")).toHaveTextContent("通信エラーが発生しました。");
    await userEvent.click(screen.getByRole("button", { name: "リトライ" }));
    expect(await screen.findByText("ゲスト")).toBeInTheDocument();
  });
});
