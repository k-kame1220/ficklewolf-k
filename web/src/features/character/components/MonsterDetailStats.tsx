import { statUpgrade } from "@/domain/character/character";
import type { MyCharacterModel } from "@/domain/character/character";
import { STAT_NAMES, STATS } from "@/domain/stat/stat";

import { CHARACTER_MESSAGES } from "../messages";

import styles from "./MonsterDetail.module.css";

type MonsterDetailStatsProps = {
  character: MyCharacterModel;
};

/** キャラ詳細のステータス。旧作どおり「合計(+アイテムと被りの分)」。天気のボーナスは合計にだけ入る */
const MonsterDetailStats = (props: MonsterDetailStatsProps) => {
  const { character } = props;

  return (
    <dl className={styles.stats} aria-label={CHARACTER_MESSAGES.stats}>
      {STATS.map(stat => (
        <div key={stat} className={styles.statRow}>
          <dt>{STAT_NAMES[stat]}</dt>
          <dd>{`${String(character.stats[stat].total)}(+${String(statUpgrade(character.stats[stat]))})`}</dd>
        </div>
      ))}
    </dl>
  );
};

export default MonsterDetailStats;
