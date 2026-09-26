import * as v from "valibot";
import { describe, expect, it } from "vitest";

import { ATTRIBUTES } from "../attribute/attribute";

import { createBattle, step } from "./engine";
import { ENEMY_ACTIONS, PLAYER_ACTIONS, REJECT_REASONS, SPECIAL_ACTIONS } from "./types";

import type { BattleEvent, BattleState } from "./types";

const AttributeSchema = v.picklist(ATTRIBUTES);

const EnemySchema = v.strictObject({
  hp: v.number(),
  attack: v.number(),
  defence: v.number(),
  attribute: AttributeSchema,
  attackBuffRate: v.number(),
  defenceBuffAmount: v.number(),
  fixedAttackPower: v.number(),
  strongAttackPower: v.number(),
  recoveryRate: v.number(),
  changeAttribute: v.nullable(AttributeSchema),
  attackDebuff: v.number(),
  defenceDebuff: v.number(),
  turns: v.array(v.picklist(ENEMY_ACTIONS))
});

const CommandSchema = v.variant("type", [
  v.strictObject({ type: v.picklist([...PLAYER_ACTIONS, "check"]) }),
  v.strictObject({ type: v.literal("rewind"), to: v.number() }),
  v.strictObject({ type: v.literal("special"), turn: v.number(), action: v.picklist(SPECIAL_ACTIONS) })
]);

const ExpectSchema = v.strictObject({
  stage: v.optional(v.number()),
  turn: v.optional(v.number()),
  playerHp: v.optional(v.number()),
  enemyHp: v.optional(v.number()),
  enemyMaxHp: v.optional(v.number()),
  enemyAttribute: v.optional(AttributeSchema),
  outcome: v.optional(v.picklist(["ongoing", "win", "lose"])),
  checkpoints: v.optional(v.array(v.number())),
  numbnessTurns: v.optional(v.number()),
  paralyzed: v.optional(v.boolean()),
  rejected: v.optional(v.picklist(REJECT_REASONS))
});

const CaseSchema = v.strictObject({
  name: v.string(),
  description: v.optional(v.string()),
  seed: v.number(),
  player: v.strictObject({
    hp: v.number(),
    attack: v.number(),
    defence: v.number(),
    attribute: AttributeSchema,
    attackBuffRate: v.number(),
    defenceBuffAmount: v.number(),
    checkMax: v.number(),
    rewindMax: v.number(),
    specialMax: v.number(),
    numbnessResistant: v.boolean()
  }),
  enemies: v.tupleWithRest([EnemySchema], EnemySchema),
  steps: v.array(v.strictObject({ command: CommandSchema, expect: ExpectSchema }))
});

const caseFiles = import.meta.glob("../../../../spec/battle/cases/*.json", { eager: true, import: "default" });

const cases = Object.entries(caseFiles)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([path, content]) => ({ file: path.split("/").at(-1) ?? path, battleCase: v.parse(CaseSchema, content) }));

const snapshot = (state: BattleState, events: readonly BattleEvent[]): Record<string, unknown> => ({
  stage: state.stage,
  turn: state.turn,
  playerHp: state.player.hp,
  enemyHp: state.enemy.hp,
  enemyMaxHp: state.enemy.maxHp,
  enemyAttribute: state.enemy.attribute,
  outcome: state.outcome,
  checkpoints: state.checkpoints,
  numbnessTurns: state.numbnessTurns,
  paralyzed: new Set(events.map(event => event.type)).has("paralyzed")
});

describe("バトルのゴールデンテスト（spec/battle/cases）", () => {
  it("ケースが 1 件以上読み込まれている", () => {
    expect(cases.length).toBeGreaterThan(0);
  });

  it.each(cases)("$file", ({ battleCase }) => {
    const initial = createBattle({ seed: battleCase.seed, player: battleCase.player, enemies: battleCase.enemies });

    battleCase.steps.reduce((state, stepCase, index) => {
      const result = step(state, stepCase.command);
      const actual = (() => {
        if (!result.ok) return { rejected: result.reason };
        const values = snapshot(result.state, result.events);
        return Object.fromEntries(Object.keys(stepCase.expect).map(key => [key, values[key]]));
      })();

      expect({ step: index + 1, ...actual }).toStrictEqual({ step: index + 1, ...stepCase.expect });
      return result.ok ? result.state : state;
    }, initial);
  });
});
