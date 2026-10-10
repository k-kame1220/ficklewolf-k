import { useNavigate } from "@tanstack/react-router";

import { QuestList } from "@/features/quest-list";

import MenuScreen from "./MenuScreen";

const QuestMainPage = () => {
  const navigate = useNavigate();

  return (
    <MenuScreen current="quest">
      <QuestList
        group="main"
        onSelect={questId => {
          void navigate({ to: "/quests/$questId", params: { questId } });
        }}
      />
    </MenuScreen>
  );
};

export default QuestMainPage;
