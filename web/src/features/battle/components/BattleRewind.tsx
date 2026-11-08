import { useBattleActions } from "../hooks/useBattleActions";
import { BATTLE_MESSAGES } from "../messages";
import { useBattleStore } from "../store";

import styles from "./Battle.module.css";

/** リターンの行き先。チェックしたターン（今のターンは除く）を、敵の絵の上に鉛筆で塗った板に並べる */
const BattleRewind = () => {
  const checkpoints = useBattleStore(state => state.battle.checkpoints);
  const turn = useBattleStore(state => state.battle.turn);
  const uiPhase = useBattleStore(state => state.uiPhase);
  const closeTactic = useBattleStore(state => state.closeTactic);
  const { send } = useBattleActions();
  const targets = checkpoints.filter(checkpoint => checkpoint !== turn);

  return (
    <div className={styles.rewindPanel} role="group" aria-label={BATTLE_MESSAGES.rewindTargets}>
      {targets.map(target => (
        <button
          key={target}
          className={styles.rewindTarget}
          type="button"
          disabled={uiPhase !== "idle"}
          onClick={() => {
            send({ type: "rewind", to: target });
          }}
        >
          {`${String(target)}${BATTLE_MESSAGES.turn}`}
        </button>
      ))}
      <button className={styles.textButton} type="button" disabled={uiPhase !== "idle"} onClick={closeTactic}>
        {BATTLE_MESSAGES.back}
      </button>
    </div>
  );
};

export default BattleRewind;
