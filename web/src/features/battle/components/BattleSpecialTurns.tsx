import type { SpecialAction, TurnActionModel } from "@/domain/battle/battle";

import { useBattleActions } from "../hooks/useBattleActions";
import { BATTLE_MESSAGES, ENEMY_ACTION_NAMES, SPECIAL_ACTION_NAMES } from "../messages";
import { useBattleStore } from "../store";

import styles from "./Battle.module.css";

type BattleSpecialTurnsProps = {
  /** 書き換えられるターン */
  turns: readonly TurnActionModel[];
  /** 選んだターン（まだなら null） */
  turn: number | null;
  /** 選んだ行動（まだなら null） */
  action: SpecialAction | null;
};

/** 必殺技で書き換えるターンを選ぶ。選んだターンには選んだ行動を出し、両方そろったら「決定」 */
const BattleSpecialTurns = (props: BattleSpecialTurnsProps) => {
  const { turns, turn, action } = props;
  const uiPhase = useBattleStore(state => state.uiPhase);
  const selectSpecialTurn = useBattleStore(state => state.selectSpecialTurn);
  const { send } = useBattleActions();

  return (
    <div className={styles.tacticPanel}>
      <ul className={styles.turnList} aria-label={BATTLE_MESSAGES.specialTurns}>
        {turns.map(entry => {
          const isSelected = entry.turn === turn;
          const label = isSelected && action !== null ? SPECIAL_ACTION_NAMES[action] : ENEMY_ACTION_NAMES[entry.action];
          return (
            <li key={entry.turn} className={styles.turnRow}>
              <span>{`${String(entry.turn)}${BATTLE_MESSAGES.turn}`}</span>
              <button
                className={[styles.turnAction, isSelected ? styles.turnActionSelected : ""].join(" ")}
                type="button"
                aria-pressed={isSelected}
                aria-label={`${String(entry.turn)}${BATTLE_MESSAGES.turn}：${label}`}
                disabled={uiPhase !== "idle"}
                onClick={() => {
                  selectSpecialTurn(entry.turn);
                }}
              >
                {label}
              </button>
            </li>
          );
        })}
      </ul>
      {turn !== null && action !== null && (
        <button
          className={styles.decide}
          type="button"
          disabled={uiPhase !== "idle"}
          onClick={() => {
            send({ type: "special", turn, action });
          }}
        >
          {BATTLE_MESSAGES.decide}
        </button>
      )}
    </div>
  );
};

export default BattleSpecialTurns;
