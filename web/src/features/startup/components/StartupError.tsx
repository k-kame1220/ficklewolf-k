import Button from "@/shared/ui/Button";
import Panel from "@/shared/ui/Panel";

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
      <Panel>
        <p className={styles.message} role="alert">
          {STARTUP_MESSAGES.networkError}
        </p>
        <Button variant="pencil" onClick={onRetry}>
          {STARTUP_MESSAGES.retry}
        </Button>
      </Panel>
    </div>
  );
};

export default StartupError;
