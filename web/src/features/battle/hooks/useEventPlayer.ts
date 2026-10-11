import { useEffect } from "react";

import { useBattleStore } from "../store";

const EVENT_INTERVAL_MS = 900;

/** 演出中（`playing`）なら、イベントを一定の間を空けて 1 つずつ再生する */
export const useEventPlayer = () => {
  const uiPhase = useBattleStore(state => state.uiPhase);
  const queueLength = useBattleStore(state => state.queue.length);
  const playNext = useBattleStore(state => state.playNext);

  useEffect(() => {
    if (uiPhase !== "playing") return undefined;
    const timer = window.setTimeout(playNext, EVENT_INTERVAL_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [uiPhase, queueLength, playNext]);
};
