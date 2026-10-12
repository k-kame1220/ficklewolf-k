import { useQueryClient } from "@tanstack/react-query";

import { useRetireBattle, useSendBattleCommand } from "@/api/battle/battle.mutate";
import { freshCurrentBattleQueryOptions } from "@/api/battle/battle.query";
import { ApiError } from "@/api/core/apiError";
import type { BattleCommand } from "@/domain/battle/battle";

import { BATTLE_MESSAGES, REJECT_MESSAGES } from "../messages";
import { useBattleStore } from "../store";

/** バトルの操作（コマンド・リタイア）。結果はストアに入れる。断られたら理由を、通信に失敗したらそう出す */
export const useBattleActions = () => {
  const queryClient = useQueryClient();
  const sendCommand = useSendBattleCommand();
  const retire = useRetireBattle();
  const battle = useBattleStore(state => state.battle);
  const beginSending = useBattleStore(state => state.beginSending);
  const receiveStep = useBattleStore(state => state.receiveStep);
  const receiveBattle = useBattleStore(state => state.receiveBattle);
  const replaceBattle = useBattleStore(state => state.replaceBattle);
  const showMessage = useBattleStore(state => state.showMessage);

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
