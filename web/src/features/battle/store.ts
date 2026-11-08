import { createContext, use } from "react";
import { createStore, useStore } from "zustand";

import type {
  BattleEventModel,
  BattleModel,
  BattleStepModel,
  BattleTurnsModel,
  EnemyAction,
  RewardModel,
  SpecialAction
} from "@/domain/battle/battle";

import { BATTLE_MESSAGES, eventMessage, promptMessage, specialActionPrompt } from "./messages";

import type { StoreApi } from "zustand";

/** 画面の進み具合。`sending`: api の返事待ち / `playing`: イベントを演出中 / `idle`: 入力を待っている */
export type BattleUiPhase = "idle" | "sending" | "playing";

/** 必殺技で書き換えられる範囲（今のターンの前後。spec/battle/README.md の 11） */
const SPECIAL_RANGE = 2;

/** 必殺技で書き換えられる 1 ターン。`action` は今の敵の行動（アプリを開き直して分からないときは null） */
export type SpecialTurn = {
  readonly turn: number;
  readonly action: EnemyAction | null;
};

/**
 * 敵の絵の上に開いているもの。`reveal`: みえーるみえーる（全ターンの行動） / `rewind`: リターンの行き先を選ぶ /
 * `special`: 必殺技で書き換えるターン（`turn`）と行動（`action`）を選ぶ（選ぶ前は null）
 */
export type BattleTactic =
  | { readonly type: "reveal"; readonly turns: BattleTurnsModel["turns"] }
  | { readonly type: "rewind" }
  | {
      readonly type: "special";
      readonly turns: readonly SpecialTurn[];
      readonly turn: number | null;
      readonly action: SpecialAction | null;
    };

/** 必殺技の書き換えを待っている状態で開き直したとき、書き換えられるターン（行動は分からない） */
const resumedTactic = (battle: BattleModel): BattleTactic | null => {
  if (battle.phase !== "choosingSpecial") return null;
  const first = Math.max(1, battle.turn - SPECIAL_RANGE);
  const last = Math.min(battle.turnCount, battle.turn + SPECIAL_RANGE);
  const turns = Array.from({ length: last - first + 1 }, (_, index) => ({ turn: first + index, action: null }));
  return { type: "special", turns, turn: null, action: null };
};

/** 入力を待っているときの文言（必殺技の書き換えを待っているときは、その案内） */
const waitingMessage = (battle: BattleModel): string => {
  if (battle.phase === "choosingSpecial") return BATTLE_MESSAGES.specialPrompt;
  return promptMessage(battle);
};

/** バトル画面のストア */
export type BattleStoreState = {
  /** api が返した最新の状態（演出が終わったあとの値） */
  readonly battle: BattleModel;
  /** 画面に出している HP（演出の途中は、最新の状態より前の値） */
  readonly playerHp: number;
  readonly enemyHp: number;
  /** 画面に出している敵の名前（連戦で入れ替わるまでは前の敵） */
  readonly enemyName: string;
  /** メッセージの行 */
  readonly message: string;
  /** まだ演出していないイベント */
  readonly queue: readonly BattleEventModel[];
  /** 勝ったときの報酬（api が返したときだけ） */
  readonly reward: RewardModel | null;
  readonly uiPhase: BattleUiPhase;
  /** 敵の絵の上に開いているもの。何も開いていなければ null */
  readonly tactic: BattleTactic | null;
  /** コマンドを送り始めた */
  readonly beginSending: () => void;
  /** コマンドの結果を受け取った。イベントの演出を始める */
  readonly receiveStep: (step: BattleStepModel) => void;
  /** 決着などで、イベントなしに状態だけを受け取った（リタイア） */
  readonly receiveBattle: (battle: BattleModel) => void;
  /** イベントを 1 つ演出する。無くなったら入力待ちに戻る */
  readonly playNext: () => void;
  /** 状態を取り直した（`STALE_SEQUENCE` など）。演出せずに置き換える */
  readonly replaceBattle: (battle: BattleModel) => void;
  /** 入力待ちのまま、メッセージだけを出す（断られた理由・通信の失敗） */
  readonly showMessage: (message: string) => void;
  /** みえーるみえーるの結果を受け取った。全ターンの行動を開く */
  readonly openReveal: (result: BattleTurnsModel) => void;
  /** リターンの行き先を選ぶ */
  readonly openRewind: () => void;
  /** 必殺技を使った。書き換えるターンを選ぶ */
  readonly openSpecial: (result: BattleTurnsModel) => void;
  /** 必殺技で書き換えるターンを選ぶ（行動は選び直し） */
  readonly selectSpecialTurn: (turn: number) => void;
  /** 必殺技で書き換えたあとの行動を選ぶ */
  readonly selectSpecialAction: (action: SpecialAction) => void;
  /** 開いているものを閉じる（必殺技は閉じられない） */
  readonly closeTactic: () => void;
};

/** バトル画面のストアを作る。`initial` は画面を開いたときの状態 */
export const createBattleStore = (initial: BattleModel) =>
  createStore<BattleStoreState>()((set, get) => ({
    battle: initial,
    playerHp: initial.player.hp,
    enemyHp: initial.enemy.hp,
    enemyName: initial.enemy.name,
    message: waitingMessage(initial),
    queue: [],
    reward: null,
    uiPhase: "idle",
    tactic: resumedTactic(initial),
    beginSending: () => {
      set({ uiPhase: "sending" });
    },
    receiveStep: step => {
      set({ battle: step.battle, queue: step.events, reward: step.reward, uiPhase: "playing", tactic: null });
    },
    receiveBattle: battle => {
      set({ battle, playerHp: battle.player.hp, enemyHp: battle.enemy.hp, queue: [], uiPhase: "idle", tactic: null });
    },
    playNext: () => {
      const { battle, queue, enemyName } = get();
      const [event, ...rest] = queue;
      if (event === undefined) {
        set({ uiPhase: "idle", message: battle.phase === "finished" ? get().message : promptMessage(battle) });
        return;
      }
      const message = eventMessage(event, enemyName, battle.player.name);
      if (event.type === "playerAction" || event.type === "enemyAction") {
        set({ queue: rest, message, playerHp: event.playerHp, enemyHp: event.enemyHp });
        return;
      }
      if (event.type === "stageCleared") {
        set({ queue: rest, message, enemyName: battle.enemy.name, enemyHp: battle.enemy.hp });
        return;
      }
      set({ queue: rest, message });
    },
    replaceBattle: battle => {
      set({
        battle,
        playerHp: battle.player.hp,
        enemyHp: battle.enemy.hp,
        enemyName: battle.enemy.name,
        message: waitingMessage(battle),
        queue: [],
        uiPhase: "idle",
        tactic: resumedTactic(battle)
      });
    },
    showMessage: message => {
      set({ message, uiPhase: "idle" });
    },
    openReveal: result => {
      set({ battle: result.battle, tactic: { type: "reveal", turns: result.turns }, uiPhase: "idle" });
    },
    openRewind: () => {
      set({ tactic: { type: "rewind" }, message: BATTLE_MESSAGES.rewindPrompt });
    },
    openSpecial: result => {
      set({
        battle: result.battle,
        tactic: { type: "special", turns: result.turns, turn: null, action: null },
        message: BATTLE_MESSAGES.specialPrompt,
        uiPhase: "idle"
      });
    },
    selectSpecialTurn: turn => {
      const { tactic } = get();
      if (tactic?.type !== "special") return;
      set({ tactic: { ...tactic, turn, action: null }, message: specialActionPrompt(turn) });
    },
    selectSpecialAction: action => {
      const { tactic } = get();
      if (tactic?.type !== "special" || tactic.turn === null) return;
      set({ tactic: { ...tactic, action }, message: BATTLE_MESSAGES.specialConfirmPrompt });
    },
    closeTactic: () => {
      const { tactic, battle } = get();
      if (tactic === null || tactic.type === "special") return;
      set({ tactic: null, message: tactic.type === "rewind" ? promptMessage(battle) : get().message });
    }
  }));

/** バトル画面のストア（`BattleStoreProvider` が配る） */
export const BattleStoreContext = createContext<StoreApi<BattleStoreState> | null>(null);

/** バトル画面のストアから値を読む。`BattleStoreProvider` の外で使うとエラー */
export const useBattleStore = <T>(selector: (state: BattleStoreState) => T): T => {
  const store = use(BattleStoreContext);
  if (store === null) throw new Error("useBattleStore は BattleStoreProvider の内側で使ってください。");
  return useStore(store, selector);
};
