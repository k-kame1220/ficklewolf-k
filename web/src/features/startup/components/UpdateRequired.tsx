import Button from "@/shared/ui/Button";
import Panel from "@/shared/ui/Panel";

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
      <Panel>
        <p className={styles.message}>{STARTUP_MESSAGES.updateRequired}</p>
        <Button variant="pencil" onClick={onUpdate}>
          {STARTUP_MESSAGES.reload}
        </Button>
      </Panel>
    </div>
  );
};

export default UpdateRequired;
