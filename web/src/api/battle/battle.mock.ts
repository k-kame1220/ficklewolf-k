import { http, HttpResponse } from "msw";
import * as v from "valibot";

import { API_BASE_URL } from "@/api/core/config";
import type { components } from "@/api/generated/schema";
import { authenticate, problem, readJson } from "@/api/mocks/db";
import type { MockBattle, MockBattleStage, MockDb } from "@/api/mocks/db";
import { ATTRIBUTES, attackMultiplier } from "@/domain/attribute/attribute";

/*
 * バトルの簡易モック。画面を動かすためだけのもので、バトルのルールの正ではない（正は spec/battle/README.md と api。
 * docs/02 D-8）。敵の行動は quests.json の並びどおりに来るが、ダメージなどの計算は大雑把にしている。
 */

const questsRaw =
  Object.values(
    import.meta.glob<string>("../../../../spec/master/quests.json", { eager: true, query: "?raw", import: "default" })
  )[0] ?? "null";
const charactersRaw =
  Object.values(
    import.meta.glob<string>("../../../../spec/master/characters.json", {
      eager: true,
      query: "?raw",
      import: "default"
    })
  )[0] ?? "null";

type Battle = components["schemas"]["Battle"];
type BattleEvent = components["schemas"]["BattleEvent"];
type EnemyAction = components["schemas"]["EnemyAction"];
type PlayerActionCommand = "attack" | "defend" | "attackBuff" | "defenceBuff";

const HTTP_OK = 200;
const HTTP_CREATED = 201;
const HTTP_BAD_REQUEST = 400;
const HTTP_UNAUTHORIZED = 401;
const HTTP_NOT_FOUND = 404;
const HTTP_CONFLICT = 409;
const EXPIRES_IN_MS = 86_400_000;
const GUARDED_DAMAGE_DIVISOR = 10;
const MIN_DAMAGE = 1;

const EnemyActionSchema = v.picklist([
  "attack",
  "defend",
  "attackBuff",
  "defenceBuff",
  "fixedAttack",
  "strongAttack",
  "concentration",
  "deathblow",
  "provocation",
  "fullRecovery",
  "rateRecovery",
  "changeAttribute",
  "numbness",
  "attackDebuff",
  "defenceDebuff"
]);

const MasterQuestsSchema = v.array(
  v.object({
    id: v.string(),
    kind: v.string(),
    order: v.number(),
    weatherId: v.optional(v.string()),
    rewards: v.object({ recruit: v.nullable(v.string()) }),
    stages: v.array(
      v.object({
        name: v.string(),
        imageKey: v.string(),
        revealCount: v.number(),
        battle: v.object({
          hp: v.number(),
          attack: v.number(),
          defence: v.number(),
          attribute: v.picklist(ATTRIBUTES),
          defenceBuffAmount: v.number(),
          fixedAttackPower: v.number(),
          strongAttackPower: v.number(),
          turns: v.array(EnemyActionSchema)
        })
      })
    )
  })
);

const MasterCharactersSchema = v.array(
  v.object({
    id: v.string(),
    name: v.string(),
    attribute: v.picklist(ATTRIBUTES),
    assets: v.object({ main: v.string(), icon: v.string(), home: v.string() }),
    base: v.object({
      hp: v.number(),
      attack: v.number(),
      defence: v.number(),
      attackBuffRate: v.number(),
      defenceBuffAmount: v.number(),
      checkMax: v.number(),
      rewindMax: v.number(),
      specialMax: v.number()
    })
  })
);

const CommandRequestSchema = v.strictObject({
  seq: v.number(),
  command: v.strictObject({ type: v.picklist(["attack", "defend", "attackBuff", "defenceBuff"]) })
});

/** バトルの状態が 1 つ進んだ途中の値（プレイヤーと敵の行動を順に当てていく） */
type Progress = {
  readonly battle: Battle;
  readonly enemyDefence: number;
  readonly events: readonly BattleEvent[];
};

const playerAct = (
  progress: Progress,
  command: PlayerActionCommand,
  base: MockBattle["playerBase"],
  isEnemyGuarding: boolean
): Progress => {
  const { battle } = progress;
  const damage = (() => {
    if (command !== "attack") return 0;
    const raw = Math.max(
      MIN_DAMAGE,
      Math.floor(battle.player.attack * battle.player.attackRate - progress.enemyDefence)
    );
    if (isEnemyGuarding) return Math.floor(raw / GUARDED_DAMAGE_DIVISOR);
    return raw;
  })();
  const enemyHp = Math.max(0, battle.enemy.hp - damage);
  const player = (() => {
    if (command === "attackBuff")
      return { ...battle.player, attackRate: battle.player.attackRate + base.attackBuffRate };
    if (command === "defenceBuff") return { ...battle.player, defence: battle.player.defence + base.defenceBuffAmount };
    return battle.player;
  })();
  return {
    battle: { ...battle, player, enemy: { ...battle.enemy, hp: enemyHp } },
    enemyDefence: progress.enemyDefence,
    events: [
      ...progress.events,
      { type: "playerAction", command, isParalyzed: false, damage, playerHp: player.hp, enemyHp }
    ]
  };
};

const enemyAct = (
  progress: Progress,
  action: EnemyAction,
  stage: MockBattleStage,
  isPlayerGuarding: boolean
): Progress => {
  const { battle } = progress;
  const damage = (() => {
    if (action === "deathblow") return battle.player.hp;
    if (isPlayerGuarding) return 0;
    if (action === "attack") return Math.max(0, stage.attack - battle.player.defence);
    if (action === "strongAttack") return Math.max(0, stage.strongAttackPower - battle.player.defence);
    if (action === "fixedAttack") return stage.fixedAttackPower;
    return 0;
  })();
  const playerHp = Math.max(0, battle.player.hp - damage);
  const enemyHp = action === "fullRecovery" ? battle.enemy.maxHp : battle.enemy.hp;
  return {
    battle: { ...battle, player: { ...battle.player, hp: playerHp }, enemy: { ...battle.enemy, hp: enemyHp } },
    enemyDefence: action === "defenceBuff" ? progress.enemyDefence + stage.defenceBuffAmount : progress.enemyDefence,
    events: [...progress.events, { type: "enemyAction", action, damage, playerHp, enemyHp }]
  };
};

const enemyOf = (stage: MockBattleStage): Battle["enemy"] => ({
  name: stage.name,
  imageKey: stage.imageKey,
  attribute: stage.attribute,
  hp: stage.hp,
  maxHp: stage.hp
});

/** `GET`・`POST /quest-sessions/*`・`POST /quests/{questId}/sessions` の簡易モック */
export const createBattleMockHandlers = (db: MockDb) => {
  const quests = new Map(v.parse(MasterQuestsSchema, JSON.parse(questsRaw)).map(quest => [quest.id, quest]));
  const characters = new Map(
    v.parse(MasterCharactersSchema, JSON.parse(charactersRaw)).map(character => [character.id, character])
  );

  return [
    http.post(`${API_BASE_URL}/quests/:questId/sessions`, ({ request, params }) => {
      const me = authenticate(db, request);
      if (me === null) return problem(HTTP_UNAUTHORIZED, "UNAUTHORIZED");
      const quest = quests.get(String(params.questId));
      const isAvailable = (() => {
        if (quest === undefined) return false;
        if (quest.kind === "main") return quest.order <= me.level;
        if (quest.kind === "weather") return quest.weatherId === db.todayWeatherId;
        return false;
      })();
      const character = characters.get(me.selectedCharacterId);
      if (quest === undefined || !isAvailable || character === undefined) {
        return problem(HTTP_NOT_FOUND, "QUEST_NOT_AVAILABLE");
      }

      const stages = quest.stages.map((stage): MockBattleStage => ({
        name: stage.name,
        imageKey: stage.imageKey,
        attribute: stage.battle.attribute,
        hp: stage.battle.hp,
        attack: stage.battle.attack,
        defence: stage.battle.defence,
        defenceBuffAmount: stage.battle.defenceBuffAmount,
        strongAttackPower: stage.battle.strongAttackPower,
        fixedAttackPower: stage.battle.fixedAttackPower,
        revealCount: stage.revealCount,
        turns: stage.battle.turns
      }));
      const [first] = stages;
      if (first === undefined) return problem(HTTP_NOT_FOUND, "QUEST_NOT_AVAILABLE");
      const battle: Battle = {
        id: crypto.randomUUID(),
        questId: quest.id,
        seq: 0,
        phase: "command",
        outcome: "ongoing",
        stage: 1,
        stageCount: stages.length,
        turn: 1,
        turnCount: first.turns.length,
        player: {
          characterId: character.id,
          name: character.name,
          attribute: character.attribute,
          assets: character.assets,
          hp: character.base.hp,
          maxHp: character.base.hp,
          attack: character.base.attack * attackMultiplier(character.attribute, first.attribute),
          defence: character.base.defence,
          attackRate: 1,
          numbnessTurns: 0,
          checkRemaining: character.base.checkMax,
          rewindRemaining: character.base.rewindMax,
          specialRemaining: character.base.specialMax,
          isSpecialAvailable: false
        },
        enemy: enemyOf(first),
        checkpoints: [],
        revealRemaining: first.revealCount,
        history: [],
        expiresAt: new Date(Date.now() + EXPIRES_IN_MS).toISOString()
      };
      db.battles.set(me.id, {
        battle,
        stages,
        playerBase: {
          attackBuffRate: character.base.attackBuffRate,
          defenceBuffAmount: character.base.defenceBuffAmount
        },
        enemyDefence: first.defence
      });
      return HttpResponse.json(battle, { status: HTTP_CREATED });
    }),

    http.get(`${API_BASE_URL}/quest-sessions/current`, ({ request }) => {
      const me = authenticate(db, request);
      if (me === null) return problem(HTTP_UNAUTHORIZED, "UNAUTHORIZED");
      const current = db.battles.get(me.id);
      if (current === undefined || current.battle.phase === "finished")
        return problem(HTTP_NOT_FOUND, "NO_ACTIVE_BATTLE");
      return HttpResponse.json(current.battle);
    }),

    http.post(`${API_BASE_URL}/quest-sessions/:sessionId/commands`, async ({ request, params }) => {
      const me = authenticate(db, request);
      if (me === null) return problem(HTTP_UNAUTHORIZED, "UNAUTHORIZED");
      const current = db.battles.get(me.id);
      if (current === undefined) return problem(HTTP_NOT_FOUND, "BATTLE_NOT_FOUND");
      if (current.battle.id !== params.sessionId) return problem(HTTP_NOT_FOUND, "BATTLE_NOT_FOUND");
      const body = v.safeParse(CommandRequestSchema, await readJson(request));
      if (!body.success) return problem(HTTP_BAD_REQUEST, "VALIDATION_FAILED");
      if (body.output.seq !== current.battle.seq) return problem(HTTP_CONFLICT, "STALE_SEQUENCE");
      if (current.battle.phase === "finished") {
        return HttpResponse.json(
          {
            type: "about:blank",
            title: "Conflict",
            status: HTTP_CONFLICT,
            code: "COMMAND_REJECTED",
            reason: "BATTLE_FINISHED"
          },
          { status: HTTP_CONFLICT, headers: { "Content-Type": "application/problem+json" } }
        );
      }

      const command = body.output.command.type;
      const stage = current.stages[current.battle.stage - 1];
      const enemyAction = stage?.turns[current.battle.turn - 1];
      if (stage === undefined || enemyAction === undefined) return problem(HTTP_CONFLICT, "STALE_SEQUENCE");
      const start: Progress = { battle: current.battle, enemyDefence: current.enemyDefence, events: [] };
      const isPlayerGuarding = command === "defend";
      const isEnemyGuarding = enemyAction === "defend";
      const acted = (() => {
        if (isEnemyGuarding && !isPlayerGuarding) {
          return playerAct(enemyAct(start, enemyAction, stage, false), command, current.playerBase, true);
        }
        const afterPlayer = playerAct(start, command, current.playerBase, false);
        if (afterPlayer.battle.enemy.hp === 0) return afterPlayer;
        return enemyAct(afterPlayer, enemyAction, stage, isPlayerGuarding);
      })();

      const history = [
        ...acted.battle.history,
        { stage: acted.battle.stage, turn: acted.battle.turn, command, isParalyzed: false, enemyAction }
      ];
      const nextStage = current.stages[acted.battle.stage];
      const isEnemyDown = acted.battle.enemy.hp === 0;
      const isPlayerDown = acted.battle.player.hp === 0;
      const isLastTurn = acted.battle.turn >= acted.battle.turnCount;
      const outcome = (() => {
        if (isEnemyDown && nextStage === undefined) return "win";
        if (isPlayerDown || (isLastTurn && !isEnemyDown)) return "lose";
        return "ongoing";
      })();

      const next = ((): { readonly mock: MockBattle; readonly events: readonly BattleEvent[] } => {
        const base = { ...acted.battle, seq: acted.battle.seq + 1, history };
        if (outcome !== "ongoing") {
          return {
            mock: { ...current, battle: { ...base, phase: "finished", outcome }, enemyDefence: acted.enemyDefence },
            events: [...acted.events, { type: "finished", outcome }]
          };
        }
        if (isEnemyDown && nextStage !== undefined) {
          return {
            mock: {
              ...current,
              battle: {
                ...base,
                stage: base.stage + 1,
                turn: 1,
                turnCount: nextStage.turns.length,
                enemy: enemyOf(nextStage),
                checkpoints: [],
                revealRemaining: nextStage.revealCount
              },
              enemyDefence: nextStage.defence
            },
            events: [...acted.events, { type: "stageCleared", nextStage: base.stage + 1 }]
          };
        }
        return {
          mock: { ...current, battle: { ...base, turn: base.turn + 1 }, enemyDefence: acted.enemyDefence },
          events: acted.events
        };
      })();
      db.battles.set(me.id, next.mock);

      const reward = (() => {
        if (outcome !== "win") return null;
        const quest = quests.get(current.battle.questId);
        const cleared = db.clearedQuestIds.get(me.id) ?? new Set<string>();
        const isFirstClear = !cleared.has(current.battle.questId);
        const owned = db.ownedCharacterIds.get(me.id) ?? new Set<string>();
        const recruit = quest?.rewards.recruit ?? null;
        const recruitedCharacterId = recruit !== null && !owned.has(recruit) ? recruit : null;
        const isLevelUp = isFirstClear && quest?.kind === "main";
        const level = isLevelUp ? me.level + 1 : me.level;
        db.clearedQuestIds.set(me.id, new Set([...cleared, current.battle.questId]));
        if (recruitedCharacterId !== null) db.ownedCharacterIds.set(me.id, new Set([...owned, recruitedCharacterId]));
        db.players.set(me.id, { ...me, level });
        return { level, isLevelUp, fudaGained: 0, recruitedCharacterId, duplicate: null, items: [] };
      })();

      return HttpResponse.json(
        { events: next.events, battle: next.mock.battle, reward } satisfies components["schemas"]["BattleStepResult"],
        { status: HTTP_OK }
      );
    }),

    http.post(`${API_BASE_URL}/quest-sessions/:sessionId/retire`, ({ request, params }) => {
      const me = authenticate(db, request);
      if (me === null) return problem(HTTP_UNAUTHORIZED, "UNAUTHORIZED");
      const current = db.battles.get(me.id);
      if (current === undefined) return problem(HTTP_NOT_FOUND, "BATTLE_NOT_FOUND");
      if (current.battle.id !== params.sessionId) return problem(HTTP_NOT_FOUND, "BATTLE_NOT_FOUND");
      const battle: Battle = { ...current.battle, seq: current.battle.seq + 1, phase: "finished", outcome: "lose" };
      db.battles.set(me.id, { ...current, battle });
      return HttpResponse.json(battle);
    })
  ];
};
