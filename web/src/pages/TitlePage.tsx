import styles from "./TitlePage.module.css";

const TitlePage = () => {
  return (
    <div className={styles.root}>
      <h1 className={styles.logo}>K</h1>
      <p className={styles.subtitle}>ターン式タイムリターンバトル</p>
      <button type="button" className={styles.start}>
        Tap to Start...
      </button>
    </div>
  );
};

export default TitlePage;
