import { useNavigate } from "@tanstack/react-router";

import { BattleScreen } from "@/features/battle";

const BattlePage = () => {
  const navigate = useNavigate();

  return (
    <BattleScreen
      onExit={exit => {
        void navigate({ to: exit === "home" ? "/home" : "/quests" });
      }}
    />
  );
};

export default BattlePage;
