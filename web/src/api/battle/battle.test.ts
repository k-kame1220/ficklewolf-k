import { describe, expect, it } from "vitest";

import { createGuest } from "@/api/auth/auth.mutate";
import { ApiError } from "@/api/core/apiError";

import { retireBattle, sendBattleCommand, startQuest } from "./battle.mutate";
import { fetchCurrentBattle } from "./battle.query";

describe("バトルの API", () => {
  it("クエストを始めると 1 ターン目の状態が返り、進行中のバトルとして取れる", async () => {
    await createGuest({ name: "ゲスト" });

    const battle = await startQuest("main-a");

    expect(battle).toMatchObject({ questId: "main-a", seq: 0, phase: "command", outcome: "ongoing", turn: 1 });
    expect(battle.player.name).toBe("ZERO");
    expect(battle.enemy.name).toBe("A");
    expect(await fetchCurrentBattle()).toStrictEqual(battle);
  });

  it("進行中のバトルが無ければ null", async () => {
    await createGuest({ name: "ゲスト" });

    expect(await fetchCurrentBattle()).toBeNull();
  });

  it("挑戦できないクエストは QUEST_NOT_AVAILABLE", async () => {
    await createGuest({ name: "ゲスト" });

    await expect(startQuest("main-z")).rejects.toMatchObject({ code: "QUEST_NOT_AVAILABLE" });
  });

  it("コマンドを送ると、起きたことと次のターンの状態が返る", async () => {
    await createGuest({ name: "ゲスト" });
    const battle = await startQuest("main-a");

    const step = await sendBattleCommand({ sessionId: battle.id, seq: battle.seq, command: { type: "attack" } });

    expect(step.events.map(event => event.type)).toStrictEqual(["enemyAction", "playerAction"]);
    expect(step.battle).toMatchObject({ seq: 1, turn: 2 });
    expect(step.battle.history).toHaveLength(1);
    expect(step.reward).toBeNull();
  });

  it("手元の seq が古ければ STALE_SEQUENCE", async () => {
    await createGuest({ name: "ゲスト" });
    const battle = await startQuest("main-a");
    await sendBattleCommand({ sessionId: battle.id, seq: battle.seq, command: { type: "attack" } });

    const stale = sendBattleCommand({ sessionId: battle.id, seq: battle.seq, command: { type: "attack" } });

    await expect(stale).rejects.toBeInstanceOf(ApiError);
    await expect(stale).rejects.toMatchObject({ status: 409, code: "STALE_SEQUENCE" });
  });

  it("リタイアすると負けで決着し、進行中のバトルは無くなる", async () => {
    await createGuest({ name: "ゲスト" });
    const battle = await startQuest("main-a");

    const retired = await retireBattle(battle.id);

    expect(retired).toMatchObject({ phase: "finished", outcome: "lose" });
    expect(await fetchCurrentBattle()).toBeNull();
  });
});
