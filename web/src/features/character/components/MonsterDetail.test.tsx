import { screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { createGuest } from "@/api/auth/auth.mutate";
import { renderWithQueryClient } from "@/test/render";

import MonsterDetail from "./MonsterDetail";

describe("MonsterDetail", () => {
  it("絵・名前・属性・説明を出す", async () => {
    await createGuest({ name: "ゲスト" });

    renderWithQueryClient(<MonsterDetail characterId="zero" onBack={vi.fn()} />);

    expect(await screen.findByRole("heading", { name: "ZERO" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "ZERO" })).toBeInTheDocument();
    expect(screen.getByText("属性：月")).toBeInTheDocument();
    expect(screen.getByText(/誰も姿を見たことがない。/u)).toBeInTheDocument();
  });

  it("持っていないキャラなら、そう出して「もどる」で戻る", async () => {
    await createGuest({ name: "ゲスト" });
    const onBack = vi.fn();

    renderWithQueryClient(<MonsterDetail characterId="a" onBack={onBack} />);

    expect(await screen.findByText("このモンスターは持っていません。")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "もどる" }));
    expect(onBack).toHaveBeenCalled();
  });
});
