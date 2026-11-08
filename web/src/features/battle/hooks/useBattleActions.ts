import { useQueryClient } from "@tanstack/react-query";

import {
  useOpenSpecial,
  useRetireBattle,
  useRevealEnemyActions,
  useSendBattleCommand
} from "@/api/battle/battle.mutate";
import { freshCurrentBattleQueryOptions } from "@/api/battle/battle.query";
import { ApiError } from "@/api/core/apiError";
import type { BattleCommand } from "@/domain/battle/battle";

import { BATTLE_MESSAGES, REJECT_MESSAGES } from "../messages";
import { useBattleStore } from "../store";

/** バトルの操作（コマンド・みえーるみえーる・必殺技・リタイア）。結果はストアに入れる。断られたら理由を、通信に失敗したらそう出す */
export const useBattleActions = () => {
  const queryClient = useQueryClient();
  const sendCommand = useSendBattleCommand();
  const retire = useRetireBattle();
  const reveal = useRevealEnemyActions();
  const openSpecial = useOpenSpecial();
  const battle = useBattleStore(state => state.battle);
  const beginSending = useBattleStore(state => state.beginSending);
  const receiveStep = useBattleStore(state => state.receiveStep);
  const receiveBattle = useBattleStore(state => state.receiveBattle);
  const replaceBattle = useBattleStore(state => state.replaceBattle);
  const showMessage = useBattleStore(state => state.showMessage);
  const openReveal = useBattleStore(state => state.openReveal);
  const openSpecialChoices = useBattleStore(state => state.openSpecial);

  const handleError = async (error: Error) => {
    if (error instanceof ApiError && error.code === "STALE_SEQUENCE") {
      const latest = await queryClient.query(freshCurrentBattleQueryOptions);
      if (latest !== null) replaceBattle(latest);
      return;
    }
    if (error instanceof ApiError && error.reason !== null) {
      showMessage(REJECT_MESSAGES[error.reason]);
      return;
    }
    showMessage(BATTLE_MESSAGES.sendFailed);
  };

  return {
    /** コマンドを 1 つ送る */
    send: (command: BattleCommand) => {
      beginSending();
      sendCommand.mutate(
        { sessionId: battle.id, seq: battle.seq, command },
        {
          onSuccess: receiveStep,
          onError: error => {
            void handleError(error);
          }
        }
      );
    },
    /** みえーるみえーる（今の敵の全ターンの行動を開く） */
    reveal: () => {
      beginSending();
      reveal.mutate(
        { sessionId: battle.id, seq: battle.seq },
        {
          onSuccess: openReveal,
          onError: error => {
            void handleError(error);
          }
        }
      );
    },
    /** 必殺技を使う（書き換えるターンを選ぶ状態にする。ここで回数を 1 使う） */
    openSpecial: () => {
      beginSending();
      openSpecial.mutate(
        { sessionId: battle.id, seq: battle.seq },
        {
          onSuccess: openSpecialChoices,
          onError: error => {
            void handleError(error);
          }
        }
      );
    },
    /** リタイアする（負け扱い） */
    retire: () => {
      beginSending();
      retire.mutate(battle.id, {
        onSuccess: receiveBattle,
        onError: error => {
          void handleError(error);
        }
      });
    }
  };
};
