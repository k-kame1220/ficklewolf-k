import { BUNDLED_ASSETS } from "@/shared/assets/bundledAssets";

import { STARTUP_MESSAGES } from "../messages";

import styles from "./Startup.module.css";

/** 起動時の読み込み中の画面（ノイズの中に赤い K） */
const Loading = () => {
  return (
    <div className={styles.root}>
      <img className={styles.logo} src={BUNDLED_ASSETS.logoK} alt="" />
      <p className={styles.loading} role="status">
        {STARTUP_MESSAGES.loading}
      </p>
    </div>
  );
};

export default Loading;
