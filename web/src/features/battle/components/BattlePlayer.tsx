import { remoteAssetUrl } from "@/shared/assets/remoteAsset";
import Gauge from "@/shared/ui/Gauge";

import { BATTLE_MESSAGES } from "../messages";
import { useBattleStore } from "../store";

import styles from "./Battle.module.css";

/** 自分の欄（HP・アイコン・攻撃力・防御力・チェック・残り回数） */
const BattlePlayer = () => {
  const player = useBattleStore(state => state.battle.player);
  const playerHp = useBattleStore(state => state.playerHp);
  const checkpoints = useBattleStore(state => state.battle.checkpoints);
  const iconUrl = remoteAssetUrl(player.assets.icon);
  const lastCheckpoint = checkpoints.at(-1);

  return (
    <section className={styles.player} aria-label={player.name}>
      <div className={styles.playerGauge}>
        <Gauge value={playerHp} max={player.maxHp} label={`${player.name}のHP`} />
        <span className={styles.playerHp}>{`${String(playerHp)}/${String(player.maxHp)}`}</span>
      </div>
      <div className={styles.playerIcon}>
        {iconUrl !== null && <img className={styles.playerIconImage} src={iconUrl} alt={player.name} />}
      </div>
      <dl className={styles.stats}>
        <dt>{BATTLE_MESSAGES.attackPower}</dt>
        <dd>{Math.floor(player.attack * player.attackRate)}</dd>
        <dt>{BATTLE_MESSAGES.defencePower}</dt>
        <dd>{Math.floor(player.defence)}</dd>
        <dt>{BATTLE_MESSAGES.checkpoint}</dt>
        <dd>
          {lastCheckpoint === undefined ? BATTLE_MESSAGES.none : `${String(lastCheckpoint)}${BATTLE_MESSAGES.turn}`}
        </dd>
      </dl>
      <p className={styles.remaining}>
        <span>{`（${BATTLE_MESSAGES.special}：あと${String(player.specialRemaining)}回`}</span>
        <span>{`${BATTLE_MESSAGES.rewind}：あと${String(player.rewindRemaining)}回`}</span>
        <span>{`${BATTLE_MESSAGES.check}：あと${String(player.checkRemaining)}回）`}</span>
      </p>
    </section>
  );
};

export default BattlePlayer;
