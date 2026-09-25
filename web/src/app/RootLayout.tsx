import { Outlet } from "@tanstack/react-router";

import styles from "./RootLayout.module.css";

const RootLayout = () => {
  return (
    <div className={styles.viewport}>
      <main className={styles.screen}>
        <Outlet />
      </main>
    </div>
  );
};

export default RootLayout;
