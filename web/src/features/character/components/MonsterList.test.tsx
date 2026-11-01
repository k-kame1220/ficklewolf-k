import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createGuest } from "@/api/auth/auth.mutate";
import { API_BASE_URL } from "@/api/core/config";
import type { components } from "@/api/generated/schema";
import { server } from "@/api/mocks/node";
import { renderWithQueryClient } from "@/test/render";

import MonsterList from "./MonsterList";

const LONG_PRESS_MS = 500;

const character = (id: string, name: string): components["schemas"]["MyCharacter"] => ({
  id,
  name,
  attribute: "yang",
  description: "",
  assets: { main: `characters/${id}/main`, icon: `characters/${id}/icon`, home: `characters/${id}/home` },
  stats: {
    hp: { base: 1000, bonus: { item: 0, duplicate: 0, weather: 0 }, total: 1000 },
    attack: { base: 600, bonus: { item: 0, duplicate: 0, weather: 0 }, total: 600 },
    defence: { base: 150, bonus: { item: 0, duplicate: 0, weather: 0 }, total: 150 }
  },
  itemUses: { hp: 0, attack: 0, defence: 0 },
  itemUseMax: { hp: 20, attack: 16, defence: 15 }
});

/** ZERO と A を持っていることにする（モックのゲストは ZERO だけを持つため） */
const ownZeroAndA = () => {
  server.use(
    http.get(`${API_BASE_URL}/me/characters`, () =>
      HttpResponse.json({ characters: [character("zero", "ZERO"), character("a", "A")] })
    )
  );
};

describe("MonsterList", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("上に今の出撃キャラ、下に持っているキャラのアイコンを出す", async () => {
    await createGuest({ name: "ゲスト" });

    renderWithQueryClient(<MonsterList onOpenDetail={vi.fn()} />);

    expect(await screen.findByRole("region", { name: "出撃中" })).toHaveTextContent("ZERO");
    expect(screen.getByRole("button", { name: "ZERO" })).toHaveAttribute("aria-pressed", "true");
  });

  it("アイコンを短く押すと、そのキャラを出撃キャラにする", async () => {
    await createGuest({ name: "ゲスト" });
    ownZeroAndA();
    const sent = vi.fn();
    server.use(
      http.patch(`${API_BASE_URL}/me`, async ({ request }) => {
        const body = await request.json();
        sent(body);
        return HttpResponse.json({
          id: crypto.randomUUID(),
          name: "ゲスト",
          level: 1,
          fuda: 0,
          selectedCharacterId: "a"
        });
      })
    );
    const onOpenDetail = vi.fn();

    renderWithQueryClient(<MonsterList onOpenDetail={onOpenDetail} />);
    await userEvent.click(await screen.findByRole("button", { name: "A" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "A" })).toHaveAttribute("aria-pressed", "true");
    });
    expect(screen.getByRole("region", { name: "出撃中" })).toHaveTextContent("A");
    expect(sent).toHaveBeenCalledWith({ selectedCharacterId: "a" });
    expect(onOpenDetail).not.toHaveBeenCalled();
  });

  it("アイコンを長く押すと詳細を開き、出撃キャラは変えない", async () => {
    await createGuest({ name: "ゲスト" });
    ownZeroAndA();
    const onOpenDetail = vi.fn();

    renderWithQueryClient(<MonsterList onOpenDetail={onOpenDetail} />);
    const icon = await screen.findByRole("button", { name: "A" });
    vi.useFakeTimers();
    fireEvent.pointerDown(icon);
    await act(() => vi.advanceTimersByTimeAsync(LONG_PRESS_MS));
    fireEvent.pointerUp(icon);
    fireEvent.click(icon);

    expect(onOpenDetail).toHaveBeenCalledWith("a");
    expect(screen.getByRole("region", { name: "出撃中" })).toHaveTextContent("ZERO");
  });

  it("右クリック（コンテキストメニュー）でも詳細を開く", async () => {
    await createGuest({ name: "ゲスト" });
    const onOpenDetail = vi.fn();

    renderWithQueryClient(<MonsterList onOpenDetail={onOpenDetail} />);
    fireEvent.contextMenu(await screen.findByRole("button", { name: "ZERO" }));

    expect(onOpenDetail).toHaveBeenCalledWith("zero");
  });

  it("出撃キャラを変えられなかったらメッセージを出し、元のまま", async () => {
    await createGuest({ name: "ゲスト" });
    ownZeroAndA();
    server.use(
      http.patch(`${API_BASE_URL}/me`, () =>
        HttpResponse.json(
          { type: "about:blank", title: "Bad Request", status: 400, code: "CHARACTER_NOT_OWNED" },
          { status: 400, headers: { "Content-Type": "application/problem+json" } }
        )
      )
    );

    renderWithQueryClient(<MonsterList onOpenDetail={vi.fn()} />);
    await userEvent.click(await screen.findByRole("button", { name: "A" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("出撃キャラを変えられませんでした。");
    expect(screen.getByRole("region", { name: "出撃中" })).toHaveTextContent("ZERO");
  });
});
