import { useNavigate } from "@tanstack/react-router";

import { QuestList } from "@/features/quest-list";

import MenuScreen from "./MenuScreen";

const QuestEventPage = () => {
  const navigate = useNavigate();

  return (
    <MenuScreen current="quest">
      <QuestList
        group="event"
        onSelect={questId => {
          void navigate({ to: "/quests/$questId", params: { questId } });
        }}
      />
    </MenuScreen>
  );
};

export default QuestEventPage;
