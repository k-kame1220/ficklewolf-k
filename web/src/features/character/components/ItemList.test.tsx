import { screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { createGuest } from "@/api/auth/auth.mutate";
import { renderWithQueryClient } from "@/test/render";

import ItemList from "./ItemList";

describe("ItemList", () => {
  it("上に出撃キャラ、その下に持っているアイテムと個数を出す", async () => {
    await createGuest({ name: "ゲスト" });

    renderWithQueryClient(<ItemList onClose={vi.fn()} />);

    expect(await screen.findByRole("region", { name: "出撃中" })).toHaveTextContent("ZERO");
    const items = screen.getByRole("region", { name: "持っているアイテム" });
    expect(
      within(items)
        .getAllByRole("listitem")
        .map(item => item.textContent)
    ).toStrictEqual(["HPの酒3コ", "ATKの酒3コ", "DEFの酒3コ"]);
  });

  it("「とじる」で閉じる", async () => {
    await createGuest({ name: "ゲスト" });
    const onClose = vi.fn();

    renderWithQueryClient(<ItemList onClose={onClose} />);

    await userEvent.click(await screen.findByRole("button", { name: "とじる" }));
    expect(onClose).toHaveBeenCalled();
  });
});
