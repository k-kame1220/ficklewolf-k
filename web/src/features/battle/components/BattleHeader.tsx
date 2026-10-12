import { ATTRIBUTE_NAMES } from "@/domain/attribute/attribute";
import Gauge from "@/shared/ui/Gauge";

import { BATTLE_MESSAGES } from "../messages";
import { useBattleStore } from "../store";

import styles from "./Battle.module.css";

type BattleHeaderProps = {
  /** 「menu」を押したときに呼ぶ */
  onOpenMenu: () => void;
};

/** 上の帯（menu・敵の属性と名前・ターン・敵の HP） */
const BattleHeader = (props: BattleHeaderProps) => {
  const { onOpenMenu } = props;
  const enemyName = useBattleStore(state => state.enemyName);
  const enemyHp = useBattleStore(state => state.enemyHp);
  const enemy = useBattleStore(state => state.battle.enemy);
  const turn = useBattleStore(state => state.battle.turn);
  const stage = useBattleStore(state => state.battle.stage);
  const stageCount = useBattleStore(state => state.battle.stageCount);

  return (
    <header className={styles.header}>
      <button className={styles.menuButton} type="button" onClick={onOpenMenu}>
        {BATTLE_MESSAGES.menu}
      </button>
      <p className={styles.enemyName}>
        <span className={styles.attribute}>{ATTRIBUTE_NAMES[enemy.attribute]}</span>
        <span>{enemyName}</span>
        {stageCount > 1 && <span className={styles.stage}>{`${String(stage)}/${String(stageCount)}`}</span>}
      </p>
      <p className={styles.turn}>{`${String(turn)}${BATTLE_MESSAGES.turn}`}</p>
      <div className={styles.enemyGauge}>
        <Gauge value={enemyHp} max={enemy.maxHp} label={`${enemyName}のHP`} />
      </div>
    </header>
  );
};

export default BattleHeader;
