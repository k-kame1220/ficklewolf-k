import styles from "./ScreenFrame.module.css";

import type { ReactNode } from "react";

type ScreenFrameProps = {
  children: ReactNode;
};

const ScreenFrame = (props: ScreenFrameProps) => {
  const { children } = props;

  return (
    <div className={styles.viewport}>
      <main className={styles.screen}>{children}</main>
    </div>
  );
};

export default ScreenFrame;
