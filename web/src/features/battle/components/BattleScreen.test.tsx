import { screen, waitFor, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";

import { createGuest } from "@/api/auth/auth.mutate";
import { startQuest } from "@/api/battle/battle.mutate";
import { API_BASE_URL } from "@/api/core/config";
import type { components } from "@/api/generated/schema";
import { server } from "@/api/mocks/node";
import { renderWithQueryClient } from "@/test/render";

import BattleScreen from "./BattleScreen";

const PLAYBACK_TIMEOUT = { timeout: 5000 };
const LONG_TEST = { timeout: 15_000 };

/** ゲストを作り、クエスト A を始めてからバトル画面を出す */
const renderStartedBattle = async (onExit = vi.fn()) => {
  await createGuest({ name: "ゲスト" });
  const battle = await startQuest("main-a");
  renderWithQueryClient(<BattleScreen onExit={onExit} />);
  await screen.findByText("せんとうをはじめてください");
  return { battle, onExit };
};

const problem = (status: number, body: Record<string, string>) =>
  HttpResponse.json(
    { type: "about:blank", title: "error", status, ...body },
    {
      status,
      headers: { "Content-Type": "application/problem+json" }
    }
  );

describe("BattleScreen", () => {
  it("敵・ターン・自分の欄を出し、チェック・リターン・必殺技はまだ押せない", async () => {
    await renderStartedBattle();

    expect(screen.getByText("1ターン目")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "A" })).toBeInTheDocument();
    expect(screen.getByText("1000/1000")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "攻撃" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "チェック" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "リターン" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "必殺技" })).toBeDisabled();
  });

  it("攻撃すると、起きたことを順に出してから次のターンの入力を待つ", LONG_TEST, async () => {
    await renderStartedBattle();

    await userEvent.click(screen.getByRole("button", { name: "攻撃" }));

    expect(screen.getByRole("button", { name: "攻撃" })).toBeDisabled();
    expect(await screen.findByText("Aはガードをしている。", {}, PLAYBACK_TIMEOUT)).toBeInTheDocument();
    expect(await screen.findByText(/ZEROの攻撃。/u, {}, PLAYBACK_TIMEOUT)).toBeInTheDocument();
    expect(await screen.findByText("2ターン目の攻撃を選択してください。", {}, PLAYBACK_TIMEOUT)).toBeInTheDocument();
    expect(screen.getByText("2ターン目")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "攻撃" })).toBeEnabled();
  });

  it("バフを押すと攻撃バフ・防御バフを選べ、攻撃バフで攻撃力が上がる", LONG_TEST, async () => {
    await renderStartedBattle();
    const stats = screen.getByRole("region", { name: "ZERO" });
    const attackBefore = within(stats).getByText("攻撃力").nextElementSibling?.textContent;

    await userEvent.click(screen.getByRole("button", { name: "バフ" }));
    await userEvent.click(screen.getByRole("button", { name: "攻撃バフ" }));

    expect(await screen.findByText("2ターン目の攻撃を選択してください。", {}, PLAYBACK_TIMEOUT)).toBeInTheDocument();
    const attackAfter = within(stats).getByText("攻撃力").nextElementSibling?.textContent;
    expect(Number(attackAfter)).toBeGreaterThan(Number(attackBefore));
  });

  it("コマンドを断られたら、理由を出して入力待ちに戻る", async () => {
    await renderStartedBattle();
    server.use(
      http.post(`${API_BASE_URL}/quest-sessions/:sessionId/commands`, () =>
        problem(409, { code: "COMMAND_REJECTED", reason: "CHECK_LIMIT" })
      )
    );

    await userEvent.click(screen.getByRole("button", { name: "攻撃" }));

    expect(await screen.findByText("もうチェックできません。")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "攻撃" })).toBeEnabled();
  });

  it("STALE_SEQUENCE なら状態を取り直す", async () => {
    await renderStartedBattle();
    server.use(
      http.post(`${API_BASE_URL}/quest-sessions/:sessionId/commands`, () => problem(409, { code: "STALE_SEQUENCE" }), {
        once: true
      })
    );

    await userEvent.click(screen.getByRole("button", { name: "攻撃" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "攻撃" })).toBeEnabled();
    });
    expect(screen.getByText("せんとうをはじめてください")).toBeInTheDocument();
  });

  it("勝ったら STAGE CLEAR → 仲間 → レベルアップの順に出し、最後にホームへ", LONG_TEST, async () => {
    const { battle, onExit } = await renderStartedBattle();
    const finished: components["schemas"]["BattleStepResult"] = {
      events: [
        { type: "playerAction", command: "attack", isParalyzed: false, damage: 2000, playerHp: 1000, enemyHp: 0 },
        { type: "finished", outcome: "win" }
      ],
      battle: {
        ...battle,
        seq: 1,
        phase: "finished",
        outcome: "win",
        enemy: { ...battle.enemy, hp: 0 },
        history: [],
        expiresAt: new Date().toISOString()
      },
      reward: { level: 2, isLevelUp: true, fudaGained: 0, recruitedCharacterId: "a", duplicate: null, items: [] }
    };
    server.use(
      http.post(`${API_BASE_URL}/quest-sessions/:sessionId/commands`, () => HttpResponse.json(finished)),
      http.get(`${API_BASE_URL}/me/characters`, () =>
        HttpResponse.json({
          characters: [
            {
              id: "a",
              name: "A",
              attribute: "yang",
              description: "",
              assets: { main: "characters/a/main", icon: "characters/a/icon", home: "characters/a/home" }
            }
          ]
        })
      )
    );

    await userEvent.click(screen.getByRole("button", { name: "攻撃" }));

    await userEvent.click(await screen.findByRole("button", { name: /STAGE CLEAR/u }, PLAYBACK_TIMEOUT));
    await userEvent.click(await screen.findByRole("button", { name: /Aをゲットしました。/u }));
    await userEvent.click(await screen.findByRole("button", { name: /レベルアップしました。/u }));
    expect(onExit).toHaveBeenCalledWith("home");
  });

  it("メニューからリタイアすると LOSE を出し、タップでクエストの一覧へ", async () => {
    const { onExit } = await renderStartedBattle();

    await userEvent.click(screen.getByRole("button", { name: "menu" }));
    await userEvent.click(screen.getByRole("button", { name: "リタイア" }));
    await userEvent.click(screen.getByRole("button", { name: "リタイアする" }));
    await userEvent.click(await screen.findByRole("button", { name: /LOSE/u }));

    expect(onExit).toHaveBeenCalledWith("quests");
  });

  it("メニューのログに、済んだターンが出る", LONG_TEST, async () => {
    await renderStartedBattle();
    await userEvent.click(screen.getByRole("button", { name: "防御" }));
    await screen.findByText("2ターン目の攻撃を選択してください。", {}, PLAYBACK_TIMEOUT);

    await userEvent.click(screen.getByRole("button", { name: "menu" }));
    await userEvent.click(screen.getByRole("button", { name: "ログ" }));

    expect(screen.getByText("ZERO：防御")).toBeInTheDocument();
    expect(screen.getByText("A：防御")).toBeInTheDocument();
  });

  it("進行中のバトルが無ければ、そう出して「もどる」でクエストの一覧へ", async () => {
    await createGuest({ name: "ゲスト" });
    const onExit = vi.fn();

    renderWithQueryClient(<BattleScreen onExit={onExit} />);
    await userEvent.click(await screen.findByRole("button", { name: "もどる" }));

    expect(screen.queryByText("進行中のバトルはありません。")).toBeInTheDocument();
    expect(onExit).toHaveBeenCalledWith("quests");
  });
});
