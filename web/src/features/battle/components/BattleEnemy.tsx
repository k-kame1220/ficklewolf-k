import { remoteAssetUrl } from "@/shared/assets/remoteAsset";

import { useBattleActions } from "../hooks/useBattleActions";
import { BATTLE_MESSAGES } from "../messages";
import { useBattleStore } from "../store";

import styles from "./Battle.module.css";
import BattleReveal from "./BattleReveal";
import BattleRewind from "./BattleRewind";
import BattleSpecialTurns from "./BattleSpecialTurns";

/** 敵の絵と、みえーるみえーるの残り回数（押すと全ターンの行動を出す）。リターン・必殺技を選ぶときは絵の上に重ねる */
const BattleEnemy = () => {
  const enemyName = useBattleStore(state => state.enemyName);
  const imageKey = useBattleStore(state => state.battle.enemy.imageKey);
  const revealRemaining = useBattleStore(state => state.battle.revealRemaining);
  const phase = useBattleStore(state => state.battle.phase);
  const uiPhase = useBattleStore(state => state.uiPhase);
  const tactic = useBattleStore(state => state.tactic);
  const { reveal } = useBattleActions();
  const imageUrl = remoteAssetUrl(imageKey);
  const canReveal = uiPhase === "idle" && phase === "command" && tactic === null && revealRemaining > 0;

  const panel = (() => {
    if (tactic === null) return null;
    if (tactic.type === "reveal") return <BattleReveal turns={tactic.turns} />;
    if (tactic.type === "rewind") return <BattleRewind />;
    return <BattleSpecialTurns turns={tactic.turns} turn={tactic.turn} action={tactic.action} />;
  })();

  return (
    <section className={styles.enemy} aria-label={enemyName}>
      <button
        className={styles.reveal}
        type="button"
        disabled={!canReveal}
        aria-label={`${BATTLE_MESSAGES.reveal}（あと${String(revealRemaining)}回）`}
        onClick={reveal}
      >
        {revealRemaining}
      </button>
      {imageUrl !== null && <img className={styles.enemyImage} src={imageUrl} alt={enemyName} />}
      {panel}
    </section>
  );
};

export default BattleEnemy;
