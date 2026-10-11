import { useMyCharacters } from "@/api/character/character.query";
import { ApiError } from "@/api/core/apiError";
import { useUpdateMe } from "@/api/me/me.mutate";
import { useMe } from "@/api/me/me.query";
import { remoteAssetUrl } from "@/shared/assets/remoteAsset";
import Button from "@/shared/ui/Button";

import { CHARACTER_MESSAGES } from "../messages";

import styles from "./MonsterList.module.css";
import MonsterListIcon from "./MonsterListIcon";

type MonsterListProps = {
  /** アイコンを長く押したときに呼ぶ */
  onOpenDetail: (characterId: string) => void;
};

/**
 * モンスターの画面（S-11）。上に今の出撃キャラ、下に持っているキャラのアイコン（図鑑の番号順）。
 * アイコンを短く押すと出撃キャラにし、長く押すと詳細を開く。
 */
const MonsterList = (props: MonsterListProps) => {
  const { onOpenDetail } = props;
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

  const selected = characters.data.get(me.data.selectedCharacterId);
  const selectedImageUrl = selected === undefined ? null : remoteAssetUrl(selected.assets.main);

  return (
    <div className={styles.root}>
      <section className={styles.current} aria-label={CHARACTER_MESSAGES.selected}>
        <h2 className={styles.name}>{selected?.name ?? me.data.selectedCharacterId}</h2>
        <div className={styles.frame}>
          {selectedImageUrl !== null && (
            <img className={styles.image} src={selectedImageUrl} alt={selected?.name ?? ""} />
          )}
        </div>
      </section>
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
    </div>
  );
};

export default MonsterList;
