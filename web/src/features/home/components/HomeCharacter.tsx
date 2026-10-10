import { useMyCharacters } from "@/api/character/character.query";
import { ApiError } from "@/api/core/apiError";
import { useMe } from "@/api/me/me.query";
import { remoteAssetUrl } from "@/shared/assets/remoteAsset";
import Button from "@/shared/ui/Button";

import { HOME_MESSAGES } from "../messages";

import styles from "./HomeCharacter.module.css";

/** ホームの真ん中に出す出撃キャラの絵（所持キャラから引く）。取れるまでは読み込み中、通信に失敗したらリトライを出す */
const HomeCharacter = () => {
  const me = useMe();
  const characters = useMyCharacters();

  if (me.error instanceof ApiError || characters.error instanceof ApiError) return null;
  if (me.isError || characters.isError) {
    return (
      <div className={styles.status}>
        <p role="alert">{HOME_MESSAGES.networkError}</p>
        <Button
          variant="pencil"
          onClick={() => {
            void me.refetch();
            void characters.refetch();
          }}
        >
          {HOME_MESSAGES.retry}
        </Button>
      </div>
    );
  }
  if (me.isPending || characters.isPending) return <p className={styles.status}>{HOME_MESSAGES.loading}</p>;

  const character = characters.data.get(me.data.selectedCharacterId);
  const name = character?.name ?? me.data.selectedCharacterId;
  const imageUrl = character === undefined ? null : remoteAssetUrl(character.assets.home);

  if (imageUrl === null) return <p className={styles.name}>{name}</p>;
  return <img className={styles.image} src={imageUrl} alt={name} />;
};

export default HomeCharacter;
