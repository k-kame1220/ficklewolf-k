import { remoteAssetUrl } from "@/shared/assets/remoteAsset";

import { BATTLE_MESSAGES } from "../messages";
import { useBattleStore } from "../store";

import styles from "./Battle.module.css";

/** 敵の絵と、みえーるみえーるの残り回数（押すのは次の PR で作る） */
const BattleEnemy = () => {
  const enemyName = useBattleStore(state => state.enemyName);
  const imageKey = useBattleStore(state => state.battle.enemy.imageKey);
  const revealRemaining = useBattleStore(state => state.battle.revealRemaining);
  const imageUrl = remoteAssetUrl(imageKey);

  return (
    <section className={styles.enemy} aria-label={enemyName}>
      <button
        className={styles.reveal}
        type="button"
        disabled
        aria-label={`${BATTLE_MESSAGES.reveal}（あと${String(revealRemaining)}回）`}
      >
        {revealRemaining}
      </button>
      {imageUrl !== null && <img className={styles.enemyImage} src={imageUrl} alt={enemyName} />}
    </section>
  );
};

export default BattleEnemy;
