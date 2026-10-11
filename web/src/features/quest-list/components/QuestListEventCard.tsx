import type { MyQuestModel } from "@/domain/quest/quest";

import styles from "./QuestList.module.css";

type QuestListEventCardProps = {
  quest: MyQuestModel;
  /** 名前の上に出す見出し（お天気クエストの「―素材クエスト：音―」など）。`null` なら出さない */
  label: string | null;
  onSelect: (questId: string) => void;
};

/** イベントの一覧のカード（見出しと名前を 2 行で出す。旧作どおり） */
const QuestListEventCard = (props: QuestListEventCardProps) => {
  const { quest, label, onSelect } = props;

  return (
    <button
      className={[styles.card, styles.eventCard].join(" ")}
      type="button"
      onClick={() => {
        onSelect(quest.id);
      }}
    >
      {label !== null && <span className={styles.eventLabel}>{label}</span>}
      <span className={styles.eventName}>{quest.name}</span>
    </button>
  );
};

export default QuestListEventCard;
