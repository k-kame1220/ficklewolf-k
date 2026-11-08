import { useMutation, useQueryClient } from "@tanstack/react-query";

import { characterKeys } from "@/api/character/character.keys";
import { apiClient } from "@/api/core/client";
import { parseResponse } from "@/api/core/response";
import { meKeys } from "@/api/me/me.keys";
import { questKeys } from "@/api/quest/quest.keys";
import type { BattleCommand, BattleModel, BattleStepModel, BattleTurnsModel } from "@/domain/battle/battle";

import { battleKeys } from "./battle.keys";
import { battleStepToDomain, battleToDomain, battleTurnsToDomain } from "./battle.mapper";
import {
  BattleResponseSchema,
  BattleStepResponseSchema,
  RevealResponseSchema,
  SpecialChoicesResponseSchema
} from "./battle.schema";

/** クエストを始める（バトルを作る）。前のバトルは無効になる */
export const startQuest = async (questId: string): Promise<BattleModel> => {
  const result = await apiClient.POST("/quests/{questId}/sessions", { params: { path: { questId } } });
  return battleToDomain(parseResponse(result, BattleResponseSchema));
};

/** コマンドを 1 つ送る。`seq` は手元の `BattleModel.seq` */
export const sendBattleCommand = async (input: {
  readonly sessionId: string;
  readonly seq: number;
  readonly command: BattleCommand;
}): Promise<BattleStepModel> => {
  const result = await apiClient.POST("/quest-sessions/{sessionId}/commands", {
    params: { path: { sessionId: input.sessionId } },
    body: { seq: input.seq, command: input.command }
  });
  return battleStepToDomain(parseResponse(result, BattleStepResponseSchema));
};

/** みえーるみえーる。今の敵の全ターンの行動を見て、残り回数を 1 減らす */
export const revealEnemyActions = async (input: {
  readonly sessionId: string;
  readonly seq: number;
}): Promise<BattleTurnsModel> => {
  const result = await apiClient.POST("/quest-sessions/{sessionId}/reveal", {
    params: { path: { sessionId: input.sessionId } },
    body: { seq: input.seq }
  });
  return battleTurnsToDomain(parseResponse(result, RevealResponseSchema));
};

/** 必殺技を使う。書き換えられるターンの敵の行動が返り、この時点で必殺技の回数を 1 使う */
export const openSpecial = async (input: {
  readonly sessionId: string;
  readonly seq: number;
}): Promise<BattleTurnsModel> => {
  const result = await apiClient.POST("/quest-sessions/{sessionId}/special", {
    params: { path: { sessionId: input.sessionId } },
    body: { seq: input.seq }
  });
  return battleTurnsToDomain(parseResponse(result, SpecialChoicesResponseSchema));
};

/** リタイアする（負け扱い） */
export const retireBattle = async (sessionId: string): Promise<BattleModel> => {
  const result = await apiClient.POST("/quest-sessions/{sessionId}/retire", { params: { path: { sessionId } } });
  return battleToDomain(parseResponse(result, BattleResponseSchema));
};

/** クエストを始める。成功したら進行中のバトルのキャッシュを新しいバトルにする */
export const useStartQuest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: startQuest,
    onSuccess: battle => {
      queryClient.setQueryData(battleKeys.current, battle);
    }
  });
};

/** コマンドを送る。決着したら、報酬で変わるプロフィール・所持キャラ・クエストを取り直す */
export const useSendBattleCommand = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sendBattleCommand,
    onSuccess: step => {
      if (step.battle.phase !== "finished") return;
      void queryClient.invalidateQueries({ queryKey: meKeys.me });
      void queryClient.invalidateQueries({ queryKey: characterKeys.mine });
      void queryClient.invalidateQueries({ queryKey: questKeys.mine });
    }
  });
};

/** みえーるみえーる */
export const useRevealEnemyActions = () => useMutation({ mutationFn: revealEnemyActions });

/** 必殺技を使う（書き換えを選ぶ状態にする） */
export const useOpenSpecial = () => useMutation({ mutationFn: openSpecial });

/** リタイアする */
export const useRetireBattle = () => useMutation({ mutationFn: retireBattle });
