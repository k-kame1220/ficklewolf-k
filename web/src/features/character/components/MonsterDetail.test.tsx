import { screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { createGuest } from "@/api/auth/auth.mutate";
import { renderWithQueryClient } from "@/test/render";

import MonsterDetail from "./MonsterDetail";

describe("MonsterDetail", () => {
  it("名前・絵・ステータス（合計(+上がった分)）・説明を出す", async () => {
    await createGuest({ name: "ゲスト" });

    renderWithQueryClient(<MonsterDetail characterId="zero" onBack={vi.fn()} />);

    expect(await screen.findByRole("heading", { name: "ZERO" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "ZERO" })).toBeInTheDocument();
    expect(screen.getByText("1000(+0)")).toBeInTheDocument();
    expect(screen.getByText(/誰も姿を見たことがない。/u)).toBeInTheDocument();
  });

  it("個数を選んで「使う」と、ステータスが上がり、持っている数が減る", async () => {
    await createGuest({ name: "ゲスト" });

    renderWithQueryClient(<MonsterDetail characterId="zero" onBack={vi.fn()} />);

    const row = (await screen.findByText("HPの酒")).closest("li");
    if (row === null) throw new Error("HPの酒 の行がない");
    expect(within(row).getByText("3コ")).toBeInTheDocument();

    await userEvent.click(within(row).getByRole("button", { name: "HPの酒をふやす" }));
    await userEvent.click(within(row).getByRole("button", { name: "HPの酒をふやす" }));
    await userEvent.click(within(row).getByRole("button", { name: "使う" }));

    expect(await screen.findByText("1084(+84)")).toBeInTheDocument();
    expect(await within(row).findByText("1コ")).toBeInTheDocument();
    expect(within(row).getByLabelText("HPの酒を使う個数")).toHaveTextContent("0");
  });

  it("持っている数より多くは選べない", async () => {
    await createGuest({ name: "ゲスト" });

    renderWithQueryClient(<MonsterDetail characterId="zero" onBack={vi.fn()} />);

    const row = (await screen.findByText("DEFの酒")).closest("li");
    if (row === null) throw new Error("DEFの酒 の行がない");
    const increase = within(row).getByRole("button", { name: "DEFの酒をふやす" });
    await userEvent.click(increase);
    await userEvent.click(increase);
    await userEvent.click(increase);

    expect(within(row).getByLabelText("DEFの酒を使う個数")).toHaveTextContent("3");
    expect(increase).toBeDisabled();
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
