import { Link } from "@tanstack/react-router";

import { BUNDLED_ASSETS } from "@/shared/assets/bundledAssets";

import styles from "./TitlePage.module.css";

const TitlePage = () => {
  return (
    <div className={styles.root}>
      <h1 className={styles.title}>
        <img className={styles.emblem} src={BUNDLED_ASSETS.titleEmblem} alt="K" />
      </h1>
      <Link className={styles.start} to="/home">
        Tap to Start...
      </Link>
    </div>
  );
};

export default TitlePage;
