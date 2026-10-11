import { useBattleStore } from "../store";

import styles from "./Battle.module.css";

/** メッセージの行（起きたこと・次に選ぶこと） */
const BattleMessage = () => {
  const message = useBattleStore(state => state.message);

  return (
    <p className={styles.message} role="status" aria-live="polite">
      {message}
    </p>
  );
};

export default BattleMessage;
