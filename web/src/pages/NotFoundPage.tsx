import { Link } from "@tanstack/react-router";

import styles from "./NotFoundPage.module.css";

const NotFoundPage = () => {
  return (
    <div className={styles.root}>
      <p>ページが見つかりません。</p>
      <Link to="/">タイトルへ</Link>
    </div>
  );
};

export default NotFoundPage;
