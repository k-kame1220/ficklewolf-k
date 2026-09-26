import { ApiError } from "@/api/core/apiError";
import { useMe } from "@/api/me/me.query";

import { HOME_MESSAGES } from "../messages";

import styles from "./HomeProfile.module.css";

const HomeProfile = () => {
  const me = useMe();

  if (me.isPending) return <p className={styles.status}>{HOME_MESSAGES.loading}</p>;
  if (me.isError && me.error instanceof ApiError) return null;
  if (me.isError) {
    return (
      <div className={styles.status}>
        <p role="alert">{HOME_MESSAGES.networkError}</p>
        <button
          className={styles.retry}
          type="button"
          onClick={() => {
            void me.refetch();
          }}
        >
          {HOME_MESSAGES.retry}
        </button>
      </div>
    );
  }

  return (
    <section className={styles.root}>
      <h1 className={styles.name}>{me.data.name}</h1>
      <p className={styles.item}>{`${HOME_MESSAGES.level} ${String(me.data.level)}`}</p>
      <p className={styles.item}>{`${HOME_MESSAGES.fuda} ${String(me.data.fuda)}`}</p>
      <dl className={styles.character}>
        <dt>{HOME_MESSAGES.selectedCharacter}</dt>
        <dd>{me.data.selectedCharacterId}</dd>
      </dl>
    </section>
  );
};

export default HomeProfile;
