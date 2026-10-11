import type { MyQuestModel } from "@/domain/quest/quest";
import { remoteAssetUrl } from "@/shared/assets/remoteAsset";

import styles from "./QuestList.module.css";

type QuestListMainCardProps = {
  quest: MyQuestModel;
  onSelect: (questId: string) => void;
};

/** メインクエストのカード（左に名前、右に敵の画像。まだクリアしていない敵は黒いシルエット。旧作どおり） */
const QuestListMainCard = (props: QuestListMainCardProps) => {
  const { quest, onSelect } = props;
  const imageUrl = remoteAssetUrl(quest.imageKey);

  return (
    <button
      className={styles.card}
      type="button"
      onClick={() => {
        onSelect(quest.id);
      }}
    >
      <span className={styles.mainName}>{quest.name}</span>
      {imageUrl !== null && (
        <img
          className={quest.isCleared ? styles.image : [styles.image, styles.silhouette].join(" ")}
          src={imageUrl}
          alt=""
        />
      )}
    </button>
  );
};

export default QuestListMainCard;
