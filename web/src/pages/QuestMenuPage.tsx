import { useNavigate } from "@tanstack/react-router";

import { QuestMenu } from "@/features/quest-list";

import MenuScreen from "./MenuScreen";

const QuestMenuPage = () => {
  const navigate = useNavigate();

  return (
    <MenuScreen current="quest">
      <QuestMenu
        onSelect={group => {
          void navigate({ to: group === "main" ? "/quests/main" : "/quests/event" });
        }}
      />
    </MenuScreen>
  );
};

export default QuestMenuPage;
