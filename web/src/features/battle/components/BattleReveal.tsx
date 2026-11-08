import { useEffect, useState } from "react";

import type { TurnActionModel } from "@/domain/battle/battle";

import { BATTLE_MESSAGES, ENEMY_ACTION_NAMES, revealRemainingMessage } from "../messages";
import { useBattleStore } from "../store";

import styles from "./Battle.module.css";

/** みえーるみえーるを開いておく時間（旧作どおり 10 秒） */
const REVEAL_MS = 10_000;
/** 残り時間を書き直す間隔 */
const TICK_MS = 50;
const MS_PER_SECOND = 1000;

type BattleRevealProps = {
  /** 今の敵の全ターンの行動 */
  turns: readonly TurnActionModel[];
};

/** みえーるみえーる。今の敵の全ターンの行動を、敵の絵の上に 10 秒だけ出す */
const BattleReveal = (props: BattleRevealProps) => {
  const { turns } = props;
  const closeTactic = useBattleStore(state => state.closeTactic);
  const [remainingMs, setRemainingMs] = useState(REVEAL_MS);

  useEffect(() => {
    const startedAt = Date.now();
    const timer = setInterval(() => {
      const left = REVEAL_MS - (Date.now() - startedAt);
      if (left <= 0) {
        closeTactic();
        return;
      }
      setRemainingMs(left);
    }, TICK_MS);
    return () => {
      clearInterval(timer);
    };
  }, [closeTactic]);

  return (
    <div className={styles.tacticPanel}>
      <ol className={styles.turnList} aria-label={BATTLE_MESSAGES.revealTurns}>
        {turns.map(entry => (
          <li key={entry.turn} className={styles.turnRow}>
            <span>{`${String(entry.turn)}${BATTLE_MESSAGES.turn}`}</span>
            <span>{ENEMY_ACTION_NAMES[entry.action]}</span>
          </li>
        ))}
      </ol>
      <p className={styles.revealTimer} role="timer">
        {revealRemainingMessage(remainingMs / MS_PER_SECOND)}
      </p>
    </div>
  );
};

export default BattleReveal;
