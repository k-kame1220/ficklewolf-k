import { HomeProfile } from "@/features/home";

import styles from "./HomePage.module.css";

const HomePage = () => {
  return (
    <div className={styles.root}>
      <HomeProfile />
    </div>
  );
};

export default HomePage;
