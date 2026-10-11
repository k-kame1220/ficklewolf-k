import { screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";

import { createGuest } from "@/api/auth/auth.mutate";
import { API_BASE_URL } from "@/api/core/config";
import { server } from "@/api/mocks/node";
import { renderWithQueryClient } from "@/test/render";

import QuestList from "./QuestList";

describe("QuestList", () => {
  it("メインの一覧は、名前と敵の画像を出し、まだクリアしていない敵は黒いシルエットにする", async () => {
    await createGuest({ name: "ゲスト" });
    const onSelect = vi.fn();

    renderWithQueryClient(<QuestList group="main" onSelect={onSelect} />);

    const card = await screen.findByRole("button", { name: "A" });
    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(card.querySelector("img")?.className).toMatch(/silhouette/u);
    await userEvent.click(card);
    expect(onSelect).toHaveBeenCalledWith("main-a");
  });

  it("クリアした敵はシルエットにしない", async () => {
    await createGuest({ name: "ゲスト" });
    server.use(
      http.get(`${API_BASE_URL}/me/quests`, () =>
        HttpResponse.json({
          quests: [
            {
              id: "main-a",
              kind: "main",
              name: "A",
              imageKey: "characters/a/main",
              attribute: "yang",
              stageCount: 1,
              turnCount: 10,
              revealCount: 1,
              isCleared: true
            }
          ]
        })
      )
    );

    renderWithQueryClient(<QuestList group="main" onSelect={vi.fn()} />);

    const card = await screen.findByRole("button", { name: "A" });
    expect(card.querySelector("img")?.className).not.toMatch(/silhouette/u);
  });

  it("イベントの一覧は、今日のお天気クエストを「素材クエスト」として出す", async () => {
    await createGuest({ name: "ゲスト" });

    renderWithQueryClient(<QuestList group="event" onSelect={vi.fn()} />);

    expect(await screen.findByRole("button", { name: "―素材クエスト：音―雨" })).toBeInTheDocument();
  });

  it("通信に失敗したらメッセージを出し、リトライで取り直す", async () => {
    await createGuest({ name: "ゲスト" });
    server.use(http.get(`${API_BASE_URL}/me/quests`, () => HttpResponse.error(), { once: true }));

    renderWithQueryClient(<QuestList group="main" onSelect={vi.fn()} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("通信エラーが発生しました。");
    await userEvent.click(screen.getByRole("button", { name: "リトライ" }));
    expect(await screen.findByRole("button", { name: "A" })).toBeInTheDocument();
  });
});
