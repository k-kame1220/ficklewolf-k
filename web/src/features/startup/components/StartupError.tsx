import { STARTUP_MESSAGES } from "../messages";

import styles from "./Startup.module.css";

type StartupErrorProps = {
  /** リトライのボタンを押したときに呼ぶ */
  onRetry: () => void;
};

const StartupError = (props: StartupErrorProps) => {
  const { onRetry } = props;

  return (
    <div className={styles.root}>
      <p className={styles.message} role="alert">
        {STARTUP_MESSAGES.networkError}
      </p>
      <button className={styles.button} type="button" onClick={onRetry}>
        {STARTUP_MESSAGES.retry}
      </button>
    </div>
  );
};

export default StartupError;
