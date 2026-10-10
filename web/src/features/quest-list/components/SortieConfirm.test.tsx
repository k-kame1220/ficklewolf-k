import { screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { createGuest } from "@/api/auth/auth.mutate";
import { renderWithQueryClient } from "@/test/render";

import SortieConfirm from "./SortieConfirm";

describe("SortieConfirm", () => {
  it("敵と出撃キャラと相性を出し、「戦う」はまだ押せない", async () => {
    await createGuest({ name: "ゲスト" });

    renderWithQueryClient(<SortieConfirm questId="main-a" onBack={vi.fn()} />);

    const enemy = await screen.findByRole("region", { name: "敵" });
    expect(enemy).toHaveTextContent("A");
    expect(screen.getByRole("img", { name: "A" }).className).toMatch(/silhouette/u);
    expect(screen.getByRole("region", { name: "あなた" })).toHaveTextContent("ZERO");
    expect(screen.getByText("相性：有利")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "戦う" })).toBeDisabled();
  });

  it("挑戦できないクエストなら、そう出して「もどる」で戻る", async () => {
    await createGuest({ name: "ゲスト" });
    const onBack = vi.fn();

    renderWithQueryClient(<SortieConfirm questId="main-z" onBack={onBack} />);

    expect(await screen.findByText("このクエストには挑戦できません。")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "もどる" }));
    expect(onBack).toHaveBeenCalled();
  });
});
