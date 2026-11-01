import { useMyCharacters } from "@/api/character/character.query";
import { ApiError } from "@/api/core/apiError";
import { useUpdateMe } from "@/api/me/me.mutate";
import { useMe } from "@/api/me/me.query";
import Button from "@/shared/ui/Button";

import { CHARACTER_MESSAGES } from "../messages";

import styles from "./MonsterList.module.css";
import MonsterListIcon from "./MonsterListIcon";
import SelectedMonster from "./SelectedMonster";

type MonsterListProps = {
  /** アイコンを長く押したときに呼ぶ */
  onOpenDetail: (characterId: string) => void;
  /** 「アイテム表示」で呼ぶ */
  onOpenItems: () => void;
};

/**
 * モンスターの画面（S-11）。上に今の出撃キャラ（アイコンの絵とステータス）、その下に持っているキャラのアイコン（図鑑の番号順）、いちばん下に「アイテム表示」。
 * アイコンを短く押すと出撃キャラにし、長く押すと詳細を開く。
 */
const MonsterList = (props: MonsterListProps) => {
  const { onOpenDetail, onOpenItems } = props;
  const me = useMe();
  const characters = useMyCharacters();
  const updateMe = useUpdateMe();

  if (me.error instanceof ApiError || characters.error instanceof ApiError) return null;
  if (me.isError || characters.isError) {
    return (
      <div className={styles.status}>
        <p role="alert">{CHARACTER_MESSAGES.networkError}</p>
        <Button
          variant="pencil"
          onClick={() => {
            void me.refetch();
            void characters.refetch();
          }}
        >
          {CHARACTER_MESSAGES.retry}
        </Button>
      </div>
    );
  }
  if (me.isPending || characters.isPending) return <p className={styles.status}>{CHARACTER_MESSAGES.loading}</p>;

  return (
    <div className={styles.root}>
      <SelectedMonster
        character={characters.data.get(me.data.selectedCharacterId)}
        fallbackName={me.data.selectedCharacterId}
      />
      {updateMe.isError && <p role="alert">{CHARACTER_MESSAGES.selectFailed}</p>}
      <section className={styles.list} aria-label={CHARACTER_MESSAGES.list}>
        <p className={styles.help}>{CHARACTER_MESSAGES.howToUse}</p>
        <ul className={styles.grid}>
          {[...characters.data.values()].map(character => (
            <li key={character.id}>
              <MonsterListIcon
                character={character}
                isSelected={character.id === me.data.selectedCharacterId}
                isDisabled={updateMe.isPending}
                onSelect={characterId => {
                  if (characterId === me.data.selectedCharacterId) return;
                  updateMe.mutate({ selectedCharacterId: characterId });
                }}
                onOpenDetail={onOpenDetail}
              />
            </li>
          ))}
        </ul>
      </section>
      <Button variant="pencil" onClick={onOpenItems}>
        {CHARACTER_MESSAGES.openItems}
      </Button>
    </div>
  );
};

export default MonsterList;
