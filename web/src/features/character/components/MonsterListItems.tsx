import { useMyItems } from "@/api/item/item.query";
import { remoteAssetUrl } from "@/shared/assets/remoteAsset";

import { CHARACTER_MESSAGES } from "../messages";

import styles from "./MonsterList.module.css";

/** モンスターの画面の下の、持っているアイテムの一覧（`items.json` の順） */
const MonsterListItems = () => {
  const items = useMyItems();

  const content = (() => {
    if (items.isError) return <p role="alert">{CHARACTER_MESSAGES.itemsFailed}</p>;
    if (items.isPending) return <p>{CHARACTER_MESSAGES.loading}</p>;
    if (items.data.length === 0) return <p>{CHARACTER_MESSAGES.noItems}</p>;
    return (
      <ul className={styles.items}>
        {items.data.map(item => {
          const iconUrl = remoteAssetUrl(item.iconKey);
          return (
            <li key={item.id} className={styles.item}>
              <span className={styles.itemFrame}>
                {iconUrl !== null && <img className={styles.iconImage} src={iconUrl} alt="" />}
              </span>
              <span className={styles.itemName}>{item.name}</span>
              <span>{`${String(item.count)}${CHARACTER_MESSAGES.countUnit}`}</span>
            </li>
          );
        })}
      </ul>
    );
  })();

  return (
    <section className={styles.list} aria-label={CHARACTER_MESSAGES.items}>
      <h3 className={styles.heading}>{CHARACTER_MESSAGES.items}</h3>
      {content}
    </section>
  );
};

export default MonsterListItems;
