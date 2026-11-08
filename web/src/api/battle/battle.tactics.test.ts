import { describe, expect, it } from "vitest";

import { createGuest } from "@/api/auth/auth.mutate";

import { openSpecial, revealEnemyActions, sendBattleCommand, startQuest } from "./battle.mutate";

describe("バトルの API（チェック・リターン・みえーるみえーる・必殺技）", () => {
  it("みえーるみえーるで今の敵の全ターンの行動が返り、回数を使い切ると REVEAL_LIMIT", async () => {
    await createGuest({ name: "ゲスト" });
    const battle = await startQuest("main-a");

    const revealed = await revealEnemyActions({ sessionId: battle.id, seq: battle.seq });

    expect(revealed.turns).toHaveLength(battle.turnCount);
    expect(revealed.turns[0]).toStrictEqual({ turn: 1, action: "defend" });
    expect(revealed.battle).toMatchObject({ seq: battle.seq + 1, revealRemaining: 0 });
    await expect(revealEnemyActions({ sessionId: battle.id, seq: revealed.battle.seq })).rejects.toMatchObject({
      code: "COMMAND_REJECTED",
      reason: "REVEAL_LIMIT"
    });
  });

  it("1 ターン目はチェックできない（CANNOT_CHECK_FIRST_TURN）", async () => {
    await createGuest({ name: "ゲスト" });
    const battle = await startQuest("main-a");

    await expect(
      sendBattleCommand({ sessionId: battle.id, seq: battle.seq, command: { type: "check" } })
    ).rejects.toMatchObject({ reason: "CANNOT_CHECK_FIRST_TURN" });
  });

  it("チェックしたターンにリターンすると、ターンが戻りチェックポイントは空になる", async () => {
    await createGuest({ name: "ゲスト" });
    const battle = await startQuest("main-a");
    const turn2 = await sendBattleCommand({ sessionId: battle.id, seq: battle.seq, command: { type: "attack" } });
    const checked = await sendBattleCommand({
      sessionId: battle.id,
      seq: turn2.battle.seq,
      command: { type: "check" }
    });
    const turn3 = await sendBattleCommand({
      sessionId: battle.id,
      seq: checked.battle.seq,
      command: { type: "defend" }
    });

    const rewound = await sendBattleCommand({
      sessionId: battle.id,
      seq: turn3.battle.seq,
      command: { type: "rewind", to: 2 }
    });

    expect(checked.events).toStrictEqual([{ type: "checked", turn: 2 }]);
    expect(rewound.events).toStrictEqual([{ type: "rewound", to: 2 }]);
    expect(rewound.battle).toMatchObject({ turn: 2, checkpoints: [] });
    expect(rewound.battle.player.rewindRemaining).toBe(battle.player.rewindRemaining - 1);
  });

  it("必殺技の条件を満たしていなければ SPECIAL_UNAVAILABLE", async () => {
    await createGuest({ name: "ゲスト" });
    const battle = await startQuest("main-a");

    await expect(openSpecial({ sessionId: battle.id, seq: battle.seq })).rejects.toMatchObject({
      reason: "SPECIAL_UNAVAILABLE"
    });
  });
});
