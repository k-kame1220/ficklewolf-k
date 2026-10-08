import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import MenuTabs from "./MenuTabs";

describe("MenuTabs", () => {
  it("旧作と同じ 5 つのタブを並べ、今いるタブに印を付ける", () => {
    render(<MenuTabs current="home" onSelect={vi.fn()} />);

    const tabs = screen.getAllByRole("button");
    expect(tabs.map(tab => tab.textContent)).toStrictEqual(["クエスト", "モンスター", "ホーム", "ガチャ", "その他"]);
    expect(screen.getByRole("button", { name: "ホーム" })).toHaveAttribute("aria-current", "page");
  });

  it("画面がまだないタブは押せない", async () => {
    const onSelect = vi.fn();
    render(<MenuTabs current="home" onSelect={onSelect} />);

    expect(screen.getByRole("button", { name: "クエスト" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "ホーム" }));
    expect(onSelect).toHaveBeenCalledWith("home");
  });
});
