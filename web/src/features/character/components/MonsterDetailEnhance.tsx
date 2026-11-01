import { useEnhanceCharacter } from "@/api/character/character.mutate";
import { ApiError } from "@/api/core/apiError";
import { useMyItems } from "@/api/item/item.query";
import { remainingItemUses } from "@/domain/character/character";
import type { MyCharacterModel } from "@/domain/character/character";

import { CHARACTER_MESSAGES } from "../messages";

import styles from "./MonsterDetail.module.css";
import MonsterDetailEnhanceRow from "./MonsterDetailEnhanceRow";

type MonsterDetailEnhanceProps = {
  character: MyCharacterModel;
};

/** キャラ詳細の「ー強化ー」。キャラと同じ属性の、持っているアイテムだけを並べ、ステータスごとに選んだ個数だけ使う */
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
    const usableItems = items.data.filter(item => item.attribute === character.attribute);
    if (usableItems.length === 0) return <p className={styles.enhanceEmpty}>{CHARACTER_MESSAGES.noUsableItems}</p>;
    return (
      <ul className={styles.enhanceList}>
        {usableItems.map(item => (
          <MonsterDetailEnhanceRow
            key={item.id}
            stat={item.stat}
            item={item}
            max={Math.min(item.count, remainingItemUses(character, item.stat))}
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
        ))}
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
