import { getRouteApi, useNavigate } from "@tanstack/react-router";

import { MonsterDetail } from "@/features/character";

import MenuScreen from "./MenuScreen";

const monsterDetailRoute = getRouteApi("/monsters/$characterId");

const MonsterDetailPage = () => {
  const { characterId } = monsterDetailRoute.useParams();
  const navigate = useNavigate();

  return (
    <MenuScreen current="monster">
      <MonsterDetail
        characterId={characterId}
        onBack={() => {
          void navigate({ to: "/monsters" });
        }}
      />
    </MenuScreen>
  );
};

export default MonsterDetailPage;
