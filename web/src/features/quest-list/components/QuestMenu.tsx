import Button from "@/shared/ui/Button";

import { QUEST_LIST_MESSAGES } from "../messages";

import styles from "./QuestMenu.module.css";

/** クエストの一覧の分け方（メイン / イベント。お天気クエストはイベントの一覧に出す） */
export type QuestGroup = "main" | "event";

type QuestMenuProps = {
  /** 一覧のボタンを押したときに呼ぶ */
  onSelect: (group: QuestGroup) => void;
};

/** 「クエスト」のタブの最初の画面（旧作どおり、メイン / イベントのボタンを並べる。PVP はフェーズ 2） */
const QuestMenu = (props: QuestMenuProps) => {
  const { onSelect } = props;

  return (
    <nav className={styles.root} aria-label={QUEST_LIST_MESSAGES.menu}>
      <Button
        variant="pencil"
        onClick={() => {
          onSelect("main");
        }}
      >
        {QUEST_LIST_MESSAGES.main}
      </Button>
      <Button
        variant="pencil"
        onClick={() => {
          onSelect("event");
        }}
      >
        {QUEST_LIST_MESSAGES.event}
      </Button>
    </nav>
  );
};

export default QuestMenu;
