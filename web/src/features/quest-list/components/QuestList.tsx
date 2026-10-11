import { ApiError } from "@/api/core/apiError";
import { useMyQuests } from "@/api/quest/quest.query";
import Button from "@/shared/ui/Button";

import { ATTRIBUTE_LABELS, QUEST_LIST_MESSAGES } from "../messages";

import styles from "./QuestList.module.css";
import QuestListEventCard from "./QuestListEventCard";
import QuestListMainCard from "./QuestListMainCard";

import type { QuestGroup } from "./QuestMenu";

type QuestListProps = {
  /** 出す一覧（`event` はお天気クエストを先頭に、イベントクエストをその下に出す） */
  group: QuestGroup;
  /** クエストを押したときに呼ぶ */
  onSelect: (questId: string) => void;
};

/** 挑戦できるクエストの一覧。取れるまでは読み込み中、通信に失敗したらリトライを出す */
const QuestList = (props: QuestListProps) => {
  const { group, onSelect } = props;
  const quests = useMyQuests();

  if (quests.error instanceof ApiError) return null;
  if (quests.isError) {
    return (
      <div className={styles.status}>
        <p role="alert">{QUEST_LIST_MESSAGES.networkError}</p>
        <Button
          variant="pencil"
          onClick={() => {
            void quests.refetch();
          }}
        >
          {QUEST_LIST_MESSAGES.retry}
        </Button>
      </div>
    );
  }
  if (quests.isPending) return <p className={styles.status}>{QUEST_LIST_MESSAGES.loading}</p>;

  const all = [...quests.data.values()];
  const items = (() => {
    if (group === "main") return all.filter(quest => quest.kind === "main");
    return [...all.filter(quest => quest.kind === "weather"), ...all.filter(quest => quest.kind === "event")];
  })();

  if (items.length === 0) return <p className={styles.status}>{QUEST_LIST_MESSAGES.empty}</p>;

  return (
    <ul className={styles.root}>
      {items.map(quest => (
        <li key={quest.id}>
          {quest.kind === "main" ? (
            <QuestListMainCard quest={quest} onSelect={onSelect} />
          ) : (
            <QuestListEventCard
              quest={quest}
              label={
                quest.kind === "weather"
                  ? `―${QUEST_LIST_MESSAGES.materialQuest}：${ATTRIBUTE_LABELS[quest.attribute]}―`
                  : null
              }
              onSelect={onSelect}
            />
          )}
        </li>
      ))}
    </ul>
  );
};

export default QuestList;
