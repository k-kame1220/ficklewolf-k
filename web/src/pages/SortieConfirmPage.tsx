import { getRouteApi, useNavigate } from "@tanstack/react-router";

import { SortieConfirm } from "@/features/quest-list";

import MenuScreen from "./MenuScreen";

const sortieConfirmRoute = getRouteApi("/quests/$questId");

const SortieConfirmPage = () => {
  const { questId } = sortieConfirmRoute.useParams();
  const navigate = useNavigate();

  return (
    <MenuScreen current="quest">
      <SortieConfirm
        questId={questId}
        onBack={() => {
          void navigate({ to: "/quests" });
        }}
      />
    </MenuScreen>
  );
};

export default SortieConfirmPage;
