import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { createGuest } from "@/api/auth/auth.mutate";
import { API_BASE_URL } from "@/api/core/config";
import { server } from "@/api/mocks/node";
import { renderWithQueryClient } from "@/test/render";

import HomeStatus from "./HomeStatus";

describe("HomeStatus", () => {
  it("今日の日付・天気・なまえ・Lv・御札を表示する", async () => {
    await createGuest({ name: "ゲスト" });

    renderWithQueryClient(<HomeStatus />);

    expect(await screen.findByRole("heading", { name: "ゲスト" })).toBeInTheDocument();
    expect(
      screen.getByText(new Intl.DateTimeFormat("ja-JP", { dateStyle: "long" }).format(new Date()))
    ).toBeInTheDocument();
    expect(screen.getByText("Lv1")).toBeInTheDocument();
    expect(await screen.findByText("雨")).toBeInTheDocument();
    expect(screen.getByText("御札:").parentElement).toHaveTextContent("御札:0");
  });

  it("天気が取れなくても、ほかは表示する", async () => {
    await createGuest({ name: "ゲスト" });
    server.use(http.get(`${API_BASE_URL}/weather/today`, () => HttpResponse.error()));

    renderWithQueryClient(<HomeStatus />);

    expect(await screen.findByRole("heading", { name: "ゲスト" })).toBeInTheDocument();
    expect(screen.queryByText("雨")).not.toBeInTheDocument();
  });
});
