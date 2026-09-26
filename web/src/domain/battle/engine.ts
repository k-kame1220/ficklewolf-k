import { playerAttackPower, resolveEnemyAction, toDamage } from "./enemyAction";
import { nextRandom, UINT32_RANGE } from "./rng";

import type {
  BattleEvent,
  BattleSetup,
  BattleState,
  Command,
  EnemySetup,
  EnemyState,
  PlayerAction,
  PlayerState,
  RejectReason,
  SpecialAction,
  StepResult
} from "./types";

const FIRST_TURN = 1;
const FIRST_STAGE = 1;
const PARALYSIS_THRESHOLD = 0.5;
const SPECIAL_HP_DIVISOR = 2;
const SPECIAL_MIN_TURN_EXCLUSIVE = 2;
const SPECIAL_LAST_TURN_MARGIN = 2;
const SPECIAL_TARGET_RANGE = 2;
const PREEMPTIVE_ACTIONS: ReadonlySet<PlayerAction> = new Set(["defend", "defenceBuff"]);

type NumbnessCheck = {
  readonly isParalyzed: boolean;
  readonly numbnessTurns: number;
  readonly rngState: number;
};

type PlayerActionOutcome = {
  readonly player: PlayerState;
  readonly enemyHp: number;
  readonly events: readonly BattleEvent[];
};

const createEnemy = (setup: EnemySetup): EnemyState => ({
  setup,
  hp: setup.hp,
  maxHp: setup.hp,
  attribute: setup.attribute,
  attackMultiplier: 1,
  defence: setup.defence,
  provocation: 0,
  turns: setup.turns
});

/** バトルを 1 ターン目・1 体目の敵から始めた状態を作る */
export const createBattle = (setup: BattleSetup): BattleState => ({
  setup,
  stage: FIRST_STAGE,
  turn: FIRST_TURN,
  outcome: "ongoing",
  player: { hp: setup.player.hp, attackMultiplier: 1, defenceBuffCount: 0 },
  enemy: createEnemy(setup.enemies[0]),
  checkpoints: [],
  checkCount: 0,
  rewindCount: 0,
  specialCount: 0,
  numbnessTurns: 0,
  rngState: setup.seed | 0
});

const reject = (reason: RejectReason): StepResult => ({ ok: false, reason });

const check = (state: BattleState): StepResult => {
  if (state.turn === FIRST_TURN) return reject("CANNOT_CHECK_FIRST_TURN");
  if (new Set(state.checkpoints).has(state.turn)) return reject("ALREADY_CHECKED");
  if (state.checkCount >= state.setup.player.checkMax) return reject("CHECK_LIMIT");

  return {
    ok: true,
    state: { ...state, checkpoints: [...state.checkpoints, state.turn], checkCount: state.checkCount + 1 },
    events: [{ type: "checked", turn: state.turn }]
  };
};

const rewind = (state: BattleState, to: number): StepResult => {
  const checkpointSet = new Set(state.checkpoints);
  if (checkpointSet.size === 0) return reject("NO_CHECKPOINT");
  if (state.rewindCount >= state.setup.player.rewindMax) return reject("REWIND_LIMIT");
  if (checkpointSet.size === 1 && checkpointSet.has(state.turn)) return reject("CANNOT_REWIND_HERE");
  if (!checkpointSet.has(to) || to === state.turn) return reject("INVALID_REWIND_TARGET");

  return {
    ok: true,
    state: { ...state, turn: to, checkpoints: [], checkCount: 0, rewindCount: state.rewindCount + 1 },
    events: [{ type: "rewound", turn: to }]
  };
};

const special = (state: BattleState, turn: number, action: SpecialAction): StepResult => {
  const lastTurn = state.enemy.turns.length;
  const isAvailable =
    state.player.hp < state.setup.player.hp / SPECIAL_HP_DIVISOR &&
    state.rewindCount >= 1 &&
    state.turn > SPECIAL_MIN_TURN_EXCLUSIVE &&
    state.turn < lastTurn - SPECIAL_LAST_TURN_MARGIN &&
    state.specialCount < state.setup.player.specialMax;
  if (!isAvailable) return reject("SPECIAL_UNAVAILABLE");

  const isInRange = turn >= state.turn - SPECIAL_TARGET_RANGE && turn <= state.turn + SPECIAL_TARGET_RANGE;
  if (!isInRange || turn < FIRST_TURN || turn > lastTurn) return reject("INVALID_SPECIAL_TARGET");

  return {
    ok: true,
    state: {
      ...state,
      enemy: { ...state.enemy, turns: state.enemy.turns.with(turn - 1, action) },
      specialCount: state.specialCount + 1
    },
    events: [{ type: "specialUsed", turn, action }]
  };
};

const checkNumbness = (numbnessTurns: number, rngState: number): NumbnessCheck => {
  if (numbnessTurns <= 0) return { isParalyzed: false, numbnessTurns, rngState };
  const random = nextRandom(rngState);
  return {
    isParalyzed: random.value / UINT32_RANGE < PARALYSIS_THRESHOLD,
    numbnessTurns: numbnessTurns - 1,
    rngState: random.rngState
  };
};

const act = (state: BattleState, action: PlayerAction): StepResult => {
  const playerSetup = state.setup.player;
  const isPreemptive = PREEMPTIVE_ACTIONS.has(action);

  const preemptiveCheck: NumbnessCheck = isPreemptive
    ? checkNumbness(state.numbnessTurns, state.rngState)
    : { isParalyzed: false, numbnessTurns: state.numbnessTurns, rngState: state.rngState };

  const isDefending = isPreemptive && !preemptiveCheck.isParalyzed && action === "defend";
  const isDefenceBuffed = isPreemptive && !preemptiveCheck.isParalyzed && action === "defenceBuff";
  const preemptiveEvents = ((): readonly BattleEvent[] => {
    if (preemptiveCheck.isParalyzed) return [{ type: "paralyzed" }];
    if (isDefending) return [{ type: "defended" }];
    if (isDefenceBuffed) return [{ type: "defenceBuffed" }];
    return [];
  })();
  const playerBeforeEnemy = isDefenceBuffed
    ? { ...state.player, defenceBuffCount: state.player.defenceBuffCount + 1 }
    : state.player;

  const enemyResult = resolveEnemyAction({
    action: state.enemy.turns[state.turn - 1] ?? "deathblow",
    playerSetup,
    player: playerBeforeEnemy,
    enemy: state.enemy,
    numbnessTurns: preemptiveCheck.numbnessTurns,
    isDefending
  });
  const eventsAfterEnemy = [...preemptiveEvents, ...enemyResult.events];

  if (enemyResult.player.hp <= 0) {
    return {
      ok: true,
      state: {
        ...state,
        outcome: "lose",
        player: enemyResult.player,
        enemy: enemyResult.enemy,
        numbnessTurns: enemyResult.numbnessTurns,
        rngState: preemptiveCheck.rngState
      },
      events: [...eventsAfterEnemy, { type: "finished", outcome: "lose" }]
    };
  }

  const followUpCheck: NumbnessCheck = isPreemptive
    ? { ...preemptiveCheck, numbnessTurns: enemyResult.numbnessTurns }
    : checkNumbness(enemyResult.numbnessTurns, preemptiveCheck.rngState);

  const playerAction = ((): PlayerActionOutcome => {
    if (isPreemptive) return { player: enemyResult.player, enemyHp: enemyResult.enemy.hp, events: [] };
    if (followUpCheck.isParalyzed) {
      return { player: enemyResult.player, enemyHp: enemyResult.enemy.hp, events: [{ type: "paralyzed" }] };
    }
    if (action === "attackBuff") {
      return {
        player: {
          ...enemyResult.player,
          attackMultiplier: enemyResult.player.attackMultiplier + playerSetup.attackBuffRate
        },
        enemyHp: enemyResult.enemy.hp,
        events: [{ type: "attackBuffed" }]
      };
    }
    const damage = toDamage(
      playerAttackPower(enemyResult.player, playerSetup, enemyResult.enemy) - enemyResult.enemyDefenceThisTurn
    );
    return {
      player: enemyResult.player,
      enemyHp: Math.max(0, enemyResult.enemy.hp - damage),
      events: [{ type: "enemyDamaged", amount: damage }]
    };
  })();

  const events = [...eventsAfterEnemy, ...playerAction.events];
  const nextState: BattleState = {
    ...state,
    player: playerAction.player,
    enemy: { ...enemyResult.enemy, hp: playerAction.enemyHp },
    numbnessTurns: followUpCheck.numbnessTurns,
    rngState: followUpCheck.rngState
  };

  if (playerAction.enemyHp > 0) return { ok: true, state: { ...nextState, turn: state.turn + 1 }, events };

  const nextEnemySetup = state.setup.enemies[state.stage];
  if (nextEnemySetup === undefined) {
    return {
      ok: true,
      state: { ...nextState, outcome: "win" },
      events: [...events, { type: "finished", outcome: "win" }]
    };
  }

  return {
    ok: true,
    state: {
      ...nextState,
      stage: state.stage + 1,
      turn: FIRST_TURN,
      enemy: createEnemy(nextEnemySetup),
      checkpoints: [],
      checkCount: 0
    },
    events: [...events, { type: "stageChanged", stage: state.stage + 1 }]
  };
};

/**
 * バトルの 1 コマンドを処理する。状態は書き換えず、新しい状態と起きたことを返す。
 * 同じ状態とコマンドなら必ず同じ結果になる（乱数は `rngState` で受け渡す）。
 */
export const step = (state: BattleState, command: Command): StepResult => {
  if (state.outcome !== "ongoing") return reject("BATTLE_FINISHED");

  switch (command.type) {
    case "check":
      return check(state);
    case "rewind":
      return rewind(state, command.to);
    case "special":
      return special(state, command.turn, command.action);
    case "attack":
    case "defend":
    case "attackBuff":
    case "defenceBuff":
      return act(state, command.type);
  }
};
