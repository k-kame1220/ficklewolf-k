import { Link } from "@tanstack/react-router";

import styles from "./TitlePage.module.css";

const TitlePage = () => {
  return (
    <div className={styles.root}>
      <h1 className={styles.logo}>K</h1>
      <p className={styles.subtitle}>ターン式タイムリターンバトル</p>
      <Link className={styles.start} to="/home">
        Tap to Start...
      </Link>
    </div>
  );
};

export default TitlePage;
