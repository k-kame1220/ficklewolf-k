import type { MyCharacterModel } from "@/domain/character/character";
import { STAT_NAMES, STATS } from "@/domain/stat/stat";
import { remoteAssetUrl } from "@/shared/assets/remoteAsset";

import { CHARACTER_MESSAGES } from "../messages";

import styles from "./SelectedMonster.module.css";

type SelectedMonsterProps = {
  /** 出撃キャラ。所持キャラの中に見つからなければ undefined */
  character: MyCharacterModel | undefined;
  /** 見つからないときに名前の代わりに出す（出撃キャラの ID） */
  fallbackName: string;
};

/** モンスターの画面とアイテム一覧の上に出す、出撃キャラの名前・アイコンの絵・ステータス（合計） */
const SelectedMonster = (props: SelectedMonsterProps) => {
  const { character, fallbackName } = props;
  const iconUrl = character === undefined ? null : remoteAssetUrl(character.assets.icon);

  return (
    <section className={styles.root} aria-label={CHARACTER_MESSAGES.selected}>
      <h2 className={styles.name}>{character?.name ?? fallbackName}</h2>
      <div className={styles.profile}>
        <div className={styles.frame}>
          {iconUrl !== null && <img className={styles.image} src={iconUrl} alt={character?.name ?? ""} />}
        </div>
        {character !== undefined && (
          <dl className={styles.stats} aria-label={CHARACTER_MESSAGES.stats}>
            {STATS.map(stat => (
              <div key={stat} className={styles.statRow}>
                <dt>{STAT_NAMES[stat]}</dt>
                <dd>{character.stats[stat].total}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
};

export default SelectedMonster;
