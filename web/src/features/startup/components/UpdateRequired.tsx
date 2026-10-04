import { STARTUP_MESSAGES } from "../messages";

import styles from "./Startup.module.css";

type UpdateRequiredProps = {
  /** アップデートのボタンを押したときに呼ぶ（Web は読み直す） */
  onUpdate: () => void;
};

const UpdateRequired = (props: UpdateRequiredProps) => {
  const { onUpdate } = props;

  return (
    <div className={styles.root}>
      <p className={styles.message}>{STARTUP_MESSAGES.updateRequired}</p>
      <button className={styles.button} type="button" onClick={onUpdate}>
        {STARTUP_MESSAGES.reload}
      </button>
    </div>
  );
};

export default UpdateRequired;
