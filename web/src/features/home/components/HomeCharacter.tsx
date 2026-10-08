import { ApiError } from "@/api/core/apiError";
import { useMaster } from "@/api/master/master.query";
import { useMe } from "@/api/me/me.query";
import { remoteAssetUrl } from "@/shared/assets/remoteAsset";
import Button from "@/shared/ui/Button";

import { HOME_MESSAGES } from "../messages";

import styles from "./HomeCharacter.module.css";

/** ホームの真ん中に出す出撃キャラの絵。プロフィールが取れなければ、読み込み中・リトライを出す */
const HomeCharacter = () => {
  const me = useMe();
  const master = useMaster();

  if (me.isPending) return <p className={styles.status}>{HOME_MESSAGES.loading}</p>;
  if (me.isError && me.error instanceof ApiError) return null;
  if (me.isError) {
    return (
      <div className={styles.status}>
        <p role="alert">{HOME_MESSAGES.networkError}</p>
        <Button
          variant="pencil"
          onClick={() => {
            void me.refetch();
          }}
        >
          {HOME_MESSAGES.retry}
        </Button>
      </div>
    );
  }

  const character = master.characters.get(me.data.selectedCharacterId);
  const name = character?.name ?? me.data.selectedCharacterId;
  const imageUrl = character === undefined ? null : remoteAssetUrl(character.assets.home);

  if (imageUrl === null) return <p className={styles.name}>{name}</p>;
  return <img className={styles.image} src={imageUrl} alt={name} />;
};

export default HomeCharacter;
