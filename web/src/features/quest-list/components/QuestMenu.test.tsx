import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import QuestMenu from "./QuestMenu";

describe("QuestMenu", () => {
  it("メインクエストとイベントクエストのボタンを並べ、押した一覧を知らせる", async () => {
    const onSelect = vi.fn();
    render(<QuestMenu onSelect={onSelect} />);

    expect(screen.getAllByRole("button").map(button => button.textContent)).toStrictEqual([
      "メインクエスト",
      "イベントクエスト"
    ]);
    await userEvent.click(screen.getByRole("button", { name: "イベントクエスト" }));
    expect(onSelect).toHaveBeenCalledWith("event");
  });
});
