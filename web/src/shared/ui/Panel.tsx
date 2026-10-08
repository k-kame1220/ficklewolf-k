import styles from "./Panel.module.css";

import type { ReactNode } from "react";

type PanelProps = {
  children: ReactNode;
};

/** 紙に細い枠を描いた窓（お知らせ・エラーなど、ほかの画面の上や暗い背景の上に出す） */
const Panel = (props: PanelProps) => {
  const { children } = props;

  return <div className={styles.root}>{children}</div>;
};

export default Panel;
