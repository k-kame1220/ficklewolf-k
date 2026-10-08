import styles from "./MenuLayout.module.css";

import type { ReactNode } from "react";

type MenuLayoutProps = {
  /** 上の帯のすぐ下に出すもの（プレイヤーの状態など） */
  header: ReactNode;
  /** 真ん中に出すもの */
  children: ReactNode;
  /** 下の帯のすぐ上に出すもの（タブなど） */
  footer: ReactNode;
};

/** メニューの画面の枠（旧作と同じく、上下を黒いノイズの帯で挟み、間を紙にする） */
const MenuLayout = (props: MenuLayoutProps) => {
  const { header, children, footer } = props;

  return (
    <div className={styles.root}>
      <div className={styles.band} />
      <header className={styles.header}>{header}</header>
      <div className={styles.content}>{children}</div>
      <footer className={styles.footer}>{footer}</footer>
      <div className={styles.band} />
    </div>
  );
};

export default MenuLayout;
