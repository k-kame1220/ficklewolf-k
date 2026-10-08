import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { createGuest } from "@/api/auth/auth.mutate";
import { renderWithQueryClient } from "@/test/render";

import HomeStatus from "./HomeStatus";

describe("HomeStatus", () => {
  it("今日の日付・なまえ・Lv・御札を表示する", async () => {
    await createGuest({ name: "ゲスト" });

    renderWithQueryClient(<HomeStatus />);

    expect(await screen.findByRole("heading", { name: "ゲスト" })).toBeInTheDocument();
    expect(
      screen.getByText(new Intl.DateTimeFormat("ja-JP", { dateStyle: "long" }).format(new Date()))
    ).toBeInTheDocument();
    expect(screen.getByText("Lv1")).toBeInTheDocument();
    expect(screen.getByText("御札:").parentElement).toHaveTextContent("御札:0");
  });
});
