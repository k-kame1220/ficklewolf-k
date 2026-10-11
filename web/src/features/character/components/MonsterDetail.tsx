import { useMyCharacters } from "@/api/character/character.query";
import { ApiError } from "@/api/core/apiError";
import { ATTRIBUTE_NAMES } from "@/domain/attribute/attribute";
import { remoteAssetUrl } from "@/shared/assets/remoteAsset";
import Button from "@/shared/ui/Button";

import { CHARACTER_MESSAGES } from "../messages";

import styles from "./MonsterDetail.module.css";

type MonsterDetailProps = {
  characterId: string;
  /** 「もどる」で呼ぶ */
  onBack: () => void;
};

/** モンスターの詳細（S-12）。絵・名前・属性・説明。ステータスは F-06 で api に足してから出す */
const MonsterDetail = (props: MonsterDetailProps) => {
  const { characterId, onBack } = props;
  const characters = useMyCharacters();

  if (characters.error instanceof ApiError) return null;
  if (characters.isError) {
    return (
      <div className={styles.status}>
        <p role="alert">{CHARACTER_MESSAGES.networkError}</p>
        <Button
          variant="pencil"
          onClick={() => {
            void characters.refetch();
          }}
        >
          {CHARACTER_MESSAGES.retry}
        </Button>
      </div>
    );
  }
  if (characters.isPending) return <p className={styles.status}>{CHARACTER_MESSAGES.loading}</p>;

  const character = characters.data.get(characterId);
  if (character === undefined) {
    return (
      <div className={styles.status}>
        <p>{CHARACTER_MESSAGES.notFound}</p>
        <Button variant="pencil" onClick={onBack}>
          {CHARACTER_MESSAGES.back}
        </Button>
      </div>
    );
  }

  const imageUrl = remoteAssetUrl(character.assets.main);

  return (
    <article className={styles.root}>
      <h2 className={styles.name}>{character.name}</h2>
      <div className={styles.frame}>
        {imageUrl !== null && <img className={styles.image} src={imageUrl} alt={character.name} />}
      </div>
      <p className={styles.attribute}>{`${CHARACTER_MESSAGES.attribute}${ATTRIBUTE_NAMES[character.attribute]}`}</p>
      <p className={styles.description}>{character.description}</p>
      <Button variant="pencil" onClick={onBack}>
        {CHARACTER_MESSAGES.back}
      </Button>
    </article>
  );
};

export default MonsterDetail;
