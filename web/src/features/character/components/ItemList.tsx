import { useMyCharacters } from "@/api/character/character.query";
import { ApiError } from "@/api/core/apiError";
import { useMyItems } from "@/api/item/item.query";
import { useMe } from "@/api/me/me.query";
import { remoteAssetUrl } from "@/shared/assets/remoteAsset";
import Button from "@/shared/ui/Button";

import { CHARACTER_MESSAGES } from "../messages";

import styles from "./ItemList.module.css";
import SelectedMonster from "./SelectedMonster";

type ItemListProps = {
  /** 「とじる」で呼ぶ */
  onClose: () => void;
};

/** アイテム一覧（S-13）。上に出撃キャラ、その下に持っているアイテム（アイコン・名前・個数。`items.json` の順） */
const ItemList = (props: ItemListProps) => {
  const { onClose } = props;
  const me = useMe();
  const characters = useMyCharacters();
  const items = useMyItems();

  if (me.error instanceof ApiError || characters.error instanceof ApiError || items.error instanceof ApiError) {
    return null;
  }
  if (me.isError || characters.isError || items.isError) {
    return (
      <div className={styles.status}>
        <p role="alert">{CHARACTER_MESSAGES.networkError}</p>
        <Button
          variant="pencil"
          onClick={() => {
            void me.refetch();
            void characters.refetch();
            void items.refetch();
          }}
        >
          {CHARACTER_MESSAGES.retry}
        </Button>
      </div>
    );
  }
  if (me.isPending || characters.isPending || items.isPending) {
    return <p className={styles.status}>{CHARACTER_MESSAGES.loading}</p>;
  }

  return (
    <div className={styles.root}>
      <SelectedMonster
        character={characters.data.get(me.data.selectedCharacterId)}
        fallbackName={me.data.selectedCharacterId}
      />
      <section className={styles.scroll} aria-label={CHARACTER_MESSAGES.items}>
        {items.data.length === 0 && <p>{CHARACTER_MESSAGES.noItems}</p>}
        <ul className={styles.items}>
          {items.data.map(item => {
            const iconUrl = remoteAssetUrl(item.iconKey);
            return (
              <li key={item.id} className={styles.item}>
                <span className={styles.itemFrame}>
                  {iconUrl !== null && <img className={styles.itemImage} src={iconUrl} alt="" />}
                </span>
                <span>{item.name}</span>
                <span>{`${String(item.count)}${CHARACTER_MESSAGES.countUnit}`}</span>
              </li>
            );
          })}
        </ul>
      </section>
      <div className={styles.actions}>
        <Button variant="pencil" onClick={onClose}>
          {CHARACTER_MESSAGES.close}
        </Button>
      </div>
    </div>
  );
};

export default ItemList;
