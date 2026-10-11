import { createContext, use } from "react";
import { createStore, useStore } from "zustand";

import type { BattleEventModel, BattleModel, BattleStepModel, RewardModel } from "@/domain/battle/battle";

import { eventMessage, promptMessage } from "./messages";

import type { StoreApi } from "zustand";

/** 画面の進み具合。`sending`: api の返事待ち / `playing`: イベントを演出中 / `idle`: 入力を待っている */
export type BattleUiPhase = "idle" | "sending" | "playing";

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
};

/** バトル画面のストアを作る。`initial` は画面を開いたときの状態 */
export const createBattleStore = (initial: BattleModel) =>
  createStore<BattleStoreState>()((set, get) => ({
    battle: initial,
    playerHp: initial.player.hp,
    enemyHp: initial.enemy.hp,
    enemyName: initial.enemy.name,
    message: promptMessage(initial),
    queue: [],
    reward: null,
    uiPhase: "idle",
    beginSending: () => {
      set({ uiPhase: "sending" });
    },
    receiveStep: step => {
      set({ battle: step.battle, queue: step.events, reward: step.reward, uiPhase: "playing" });
    },
    receiveBattle: battle => {
      set({ battle, playerHp: battle.player.hp, enemyHp: battle.enemy.hp, queue: [], uiPhase: "idle" });
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
        message: promptMessage(battle),
        queue: [],
        uiPhase: "idle"
      });
    },
    showMessage: message => {
      set({ message, uiPhase: "idle" });
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
