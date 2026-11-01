import { useEnhanceCharacter } from "@/api/character/character.mutate";
import { ApiError } from "@/api/core/apiError";
import { useMyItems } from "@/api/item/item.query";
import { remainingItemUses } from "@/domain/character/character";
import type { MyCharacterModel } from "@/domain/character/character";
import { STATS } from "@/domain/stat/stat";

import { CHARACTER_MESSAGES } from "../messages";

import styles from "./MonsterDetail.module.css";
import MonsterDetailEnhanceRow from "./MonsterDetailEnhanceRow";

type MonsterDetailEnhanceProps = {
  character: MyCharacterModel;
};

/** キャラ詳細の「ー強化ー」。キャラと同じ属性のアイテムを、ステータスごとに選んだ個数だけ使う */
const MonsterDetailEnhance = (props: MonsterDetailEnhanceProps) => {
  const { character } = props;
  const items = useMyItems();
  const enhance = useEnhanceCharacter();

  const errorMessage = (() => {
    if (enhance.error === null) return null;
    if (enhance.error instanceof ApiError && enhance.error.code === "ITEM_NOT_ENOUGH") {
      return CHARACTER_MESSAGES.itemNotEnough;
    }
    if (enhance.error instanceof ApiError && enhance.error.code === "ENHANCE_LIMIT_EXCEEDED") {
      return CHARACTER_MESSAGES.enhanceLimitExceeded;
    }
    return CHARACTER_MESSAGES.enhanceFailed;
  })();

  const content = (() => {
    if (items.isError) return <p role="alert">{CHARACTER_MESSAGES.itemsFailed}</p>;
    if (items.isPending) return <p>{CHARACTER_MESSAGES.loading}</p>;
    const itemsByStat = new Map(
      items.data.filter(item => item.attribute === character.attribute).map(item => [item.stat, item])
    );
    return (
      <ul className={styles.enhanceList}>
        {STATS.map(stat => {
          const item = itemsByStat.get(stat);
          return (
            <MonsterDetailEnhanceRow
              key={stat}
              stat={stat}
              item={item}
              max={Math.min(item?.count ?? 0, remainingItemUses(character, stat))}
              isDisabled={enhance.isPending}
              onUse={(usedStat, count, onDone) => {
                enhance.mutate(
                  {
                    characterId: character.id,
                    counts: { hp: 0, attack: 0, defence: 0, [usedStat]: count }
                  },
                  { onSuccess: onDone }
                );
              }}
            />
          );
        })}
      </ul>
    );
  })();

  return (
    <section className={styles.enhance} aria-label={CHARACTER_MESSAGES.enhance}>
      <h3 className={styles.enhanceTitle}>{CHARACTER_MESSAGES.enhance}</h3>
      {content}
      {errorMessage !== null && <p role="alert">{errorMessage}</p>}
    </section>
  );
};

export default MonsterDetailEnhance;
