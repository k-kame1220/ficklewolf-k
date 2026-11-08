import { act, screen, waitFor, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createGuest } from "@/api/auth/auth.mutate";
import { startQuest } from "@/api/battle/battle.mutate";
import { apiClient } from "@/api/core/client";
import { API_BASE_URL } from "@/api/core/config";
import { server } from "@/api/mocks/node";
import { renderWithQueryClient } from "@/test/render";

import BattleScreen from "./BattleScreen";

const PLAYBACK_TIMEOUT = { timeout: 5000 };
const LONG_TEST = { timeout: 20_000 };
const REVEAL_MS = 10_000;

/** ゲストを作り、クエスト A を始めてから、api の形のままのバトルを返す */
const startRawBattle = async () => {
  await createGuest({ name: "ゲスト" });
  await startQuest("main-a");
  const { data } = await apiClient.GET("/quest-sessions/current");
  if (data === undefined) throw new Error("バトルを始められなかった");
  return data;
};

type Battle = Awaited<ReturnType<typeof startRawBattle>>;

/** バトル画面を出し、入力待ちになるまで待つ */
const renderBattle = async (prompt: string | RegExp) => {
  renderWithQueryClient(<BattleScreen onExit={vi.fn()} />);
  await screen.findByText(prompt);
};

/** コマンドを押し、次のターンの入力待ちになるまで待つ */
const playTurn = async (command: string, nextTurn: number) => {
  await userEvent.click(screen.getByRole("button", { name: command }));
  await screen.findByText(`${String(nextTurn)}ターン目の攻撃を選択してください。`, {}, PLAYBACK_TIMEOUT);
};

describe("BattleScreen のチェック・リターン・みえーるみえーる・必殺技", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("みえーるみえーるで今の敵の全ターンの行動を 10 秒だけ出し、回数が減る", async () => {
    await startRawBattle();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    await renderBattle("せんとうをはじめてください");

    await userEvent.click(screen.getByRole("button", { name: "みえーるみえーる（あと1回）" }));

    const turns = await screen.findByRole("list", { name: "敵の行動" });
    expect(within(turns).getAllByRole("listitem")).toHaveLength(10);
    expect(within(turns).getAllByRole("listitem")[3]).toHaveTextContent("4ターン目挑発");
    expect(screen.getByRole("timer")).toHaveTextContent(/残り \d+\.\d{2} 秒/u);
    expect(screen.getByRole("button", { name: "みえーるみえーる（あと0回）" })).toBeDisabled();

    act(() => {
      vi.advanceTimersByTime(REVEAL_MS);
    });
    await waitFor(() => {
      expect(screen.queryByRole("list", { name: "敵の行動" })).not.toBeInTheDocument();
    });
  });

  it("チェックすると、そのターンがチェックポイントになり、同じターンはもうチェックできない", LONG_TEST, async () => {
    await startRawBattle();
    await renderBattle("せんとうをはじめてください");
    await playTurn("攻撃", 2);

    await userEvent.click(screen.getByRole("button", { name: "チェック" }));

    expect(await screen.findByText("チェックしました。", {}, PLAYBACK_TIMEOUT)).toBeInTheDocument();
    const player = screen.getByRole("region", { name: "ZERO" });
    await waitFor(() => {
      expect(within(player).getByText("2ターン目")).toBeInTheDocument();
    });
    expect(within(player).getByText(/チェック：あと1回/u)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "チェック" })).toBeDisabled();
  });

  it("リターンでチェックしたターンを選ぶと、そのターンに戻る。「もどる」でやめられる", LONG_TEST, async () => {
    await startRawBattle();
    await renderBattle("せんとうをはじめてください");
    await playTurn("攻撃", 2);
    await userEvent.click(screen.getByRole("button", { name: "チェック" }));
    await screen.findByText("チェックしました。", {}, PLAYBACK_TIMEOUT);
    await screen.findByText("2ターン目の攻撃を選択してください。", {}, PLAYBACK_TIMEOUT);
    await playTurn("防御", 3);

    await userEvent.click(screen.getByRole("button", { name: "リターン" }));
    expect(screen.getByText("どこにリターンしますか。")).toBeInTheDocument();
    const targets = screen.getByRole("group", { name: "リターンする先" });
    expect(screen.getByRole("button", { name: "攻撃" })).toBeDisabled();
    await userEvent.click(within(targets).getByRole("button", { name: "もどる" }));
    expect(screen.queryByRole("group", { name: "リターンする先" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "リターン" }));
    await userEvent.click(
      within(screen.getByRole("group", { name: "リターンする先" })).getByRole("button", { name: "2ターン目" })
    );

    expect(await screen.findByText("リターンしました。", {}, PLAYBACK_TIMEOUT)).toBeInTheDocument();
    expect(await screen.findByText("2ターン目の攻撃を選択してください。", {}, PLAYBACK_TIMEOUT)).toBeInTheDocument();
    expect(screen.getByText(/リターン：あと0回/u)).toBeInTheDocument();
  });

  it("必殺技で書き換えるターンと行動を選び、「決定」で送る", LONG_TEST, async () => {
    const started = await startRawBattle();
    const ready: Battle = {
      ...started,
      turn: 5,
      player: { ...started.player, hp: 400, rewindRemaining: 0, isSpecialAvailable: true }
    };
    const choices = [
      { turn: 3, action: "defend" },
      { turn: 4, action: "provocation" },
      { turn: 5, action: "strongAttack" },
      { turn: 6, action: "defend" },
      { turn: 7, action: "attack" }
    ] as const;
    const choosing: Battle = {
      ...ready,
      seq: ready.seq + 1,
      phase: "choosingSpecial",
      specialChoices: choices,
      player: { ...ready.player, specialRemaining: 0, isSpecialAvailable: false }
    };
    const sent = vi.fn();
    server.use(
      http.get(`${API_BASE_URL}/quest-sessions/current`, () => HttpResponse.json(ready)),
      http.post(`${API_BASE_URL}/quest-sessions/:sessionId/special`, () =>
        HttpResponse.json({ turns: choices, battle: choosing })
      ),
      http.post(`${API_BASE_URL}/quest-sessions/:sessionId/commands`, async ({ request }) => {
        sent(await request.json());
        return HttpResponse.json({
          events: [{ type: "specialApplied", turn: 5, action: "provocation" }],
          battle: { ...choosing, seq: choosing.seq + 1, phase: "command", specialChoices: null },
          reward: null
        });
      })
    );
    await renderBattle("5ターン目の攻撃を選択してください。");

    await userEvent.click(screen.getByRole("button", { name: "必殺技" }));

    const turns = await screen.findByRole("list", { name: "書き換えるターン" });
    expect(screen.getByText("どの敵の行動を変えますか？")).toBeInTheDocument();
    const actions = screen.getByRole("group", { name: "書き換える行動" });
    expect(within(actions).getByRole("button", { name: "挑発" })).toBeDisabled();

    await userEvent.click(within(turns).getByRole("button", { name: "5ターン目：強攻撃" }));
    expect(screen.getByText("5ターン目の敵の行動を何に変更しますか？")).toBeInTheDocument();
    await userEvent.click(within(actions).getByRole("button", { name: "挑発" }));
    expect(screen.getByText("決定またはやりなおしてください。")).toBeInTheDocument();
    expect(within(turns).getByRole("button", { name: "5ターン目：挑発" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "決定" }));

    expect(await screen.findByText("ZEROが必殺技をくりだした。", {}, PLAYBACK_TIMEOUT)).toBeInTheDocument();
    expect(sent).toHaveBeenCalledWith({
      seq: choosing.seq,
      command: { type: "special", turn: 5, action: "provocation" }
    });
    expect(await screen.findByText("5ターン目の攻撃を選択してください。", {}, PLAYBACK_TIMEOUT)).toBeInTheDocument();
  });

  it("必殺技の書き換えを待っている状態で開き直すと、書き換えるターンを選ぶところから続ける", async () => {
    const started = await startRawBattle();
    server.use(
      http.get(`${API_BASE_URL}/quest-sessions/current`, () =>
        HttpResponse.json({
          ...started,
          turn: 5,
          phase: "choosingSpecial",
          specialChoices: [
            { turn: 3, action: "defend" },
            { turn: 4, action: "provocation" },
            { turn: 5, action: "strongAttack" },
            { turn: 6, action: "defend" },
            { turn: 7, action: "attack" }
          ]
        } satisfies Battle)
      )
    );

    await renderBattle("どの敵の行動を変えますか？");

    const turns = screen.getByRole("list", { name: "書き換えるターン" });
    expect(
      within(turns)
        .getAllByRole("button")
        .map(button => button.textContent)
    ).toStrictEqual(["防御", "挑発", "強攻撃", "防御", "攻撃"]);
    expect(screen.getByRole("button", { name: "みえーるみえーる（あと1回）" })).toBeDisabled();
  });
});
