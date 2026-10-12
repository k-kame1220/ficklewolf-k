import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { battleKeys } from "@/api/battle/battle.keys";
import { useCurrentBattle } from "@/api/battle/battle.query";
import { ApiError } from "@/api/core/apiError";
import Button from "@/shared/ui/Button";

import { useEventPlayer } from "../hooks/useEventPlayer";
import { BATTLE_MESSAGES } from "../messages";
import { useBattleStore } from "../store";

import styles from "./Battle.module.css";
import BattleCommands from "./BattleCommands";
import BattleEnemy from "./BattleEnemy";
import BattleHeader from "./BattleHeader";
import BattleMenu from "./BattleMenu";
import BattleMessage from "./BattleMessage";
import BattlePlayer from "./BattlePlayer";
import BattleResult from "./BattleResult";
import BattleStoreProvider from "./BattleStoreProvider";

import type { BattleExit } from "./BattleResult";

type BattleScreenProps = {
  /** 結果の画面を抜けるとき・進行中のバトルが無いときに呼ぶ */
  onExit: (exit: BattleExit) => void;
};

/** バトル画面の中身（ストアの内側） */
const BattleView = (props: BattleScreenProps) => {
  const { onExit } = props;
  const phase = useBattleStore(state => state.battle.phase);
  const uiPhase = useBattleStore(state => state.uiPhase);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  useEventPlayer();

  if (phase === "finished" && uiPhase === "idle") return <BattleResult onExit={onExit} />;

  return (
    <div className={styles.root}>
      <BattleHeader
        onOpenMenu={() => {
          setIsMenuOpen(true);
        }}
      />
      <BattleEnemy />
      <BattleMessage />
      <BattlePlayer />
      <BattleCommands />
      {isMenuOpen && (
        <BattleMenu
          onClose={() => {
            setIsMenuOpen(false);
          }}
        />
      )}
    </div>
  );
};

/**
 * バトル画面（S-06〜S-10）。進行中のバトルを取って表示する（アプリを開き直しても続きから）。
 * 計算はしない。コマンドを api に送り、返ってきたイベントを順に演出する（docs/02 D-8）。
 */
const BattleScreen = (props: BattleScreenProps) => {
  const { onExit } = props;
  const queryClient = useQueryClient();
  const current = useCurrentBattle();
  const exit = (destination: BattleExit) => {
    queryClient.removeQueries({ queryKey: battleKeys.current });
    onExit(destination);
  };

  if (current.error instanceof ApiError) return null;
  if (current.isError) {
    return (
      <div className={styles.status}>
        <p role="alert">{BATTLE_MESSAGES.networkError}</p>
        <Button
          variant="pencil"
          onClick={() => {
            void current.refetch();
          }}
        >
          {BATTLE_MESSAGES.retry}
        </Button>
      </div>
    );
  }
  if (current.isPending) return <p className={styles.status}>{BATTLE_MESSAGES.loading}</p>;
  if (current.data === null) {
    return (
      <div className={styles.status}>
        <p>{BATTLE_MESSAGES.noBattle}</p>
        <Button
          variant="pencil"
          onClick={() => {
            exit("quests");
          }}
        >
          {BATTLE_MESSAGES.back}
        </Button>
      </div>
    );
  }

  return (
    <BattleStoreProvider key={current.data.id} initial={current.data}>
      <BattleView onExit={exit} />
    </BattleStoreProvider>
  );
};

export default BattleScreen;
