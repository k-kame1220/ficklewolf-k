import { useNavigate } from "@tanstack/react-router";

import { MonsterList } from "@/features/character";

import MenuScreen from "./MenuScreen";

const MonsterListPage = () => {
  const navigate = useNavigate();

  return (
    <MenuScreen current="monster">
      <MonsterList
        onOpenDetail={characterId => {
          void navigate({ to: "/monsters/$characterId", params: { characterId } });
        }}
      />
    </MenuScreen>
  );
};

export default MonsterListPage;
