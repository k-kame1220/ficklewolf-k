import { useNavigate } from "@tanstack/react-router";

import { ItemList } from "@/features/character";

import MenuScreen from "./MenuScreen";

const ItemListPage = () => {
  const navigate = useNavigate();

  return (
    <MenuScreen current="monster">
      <ItemList
        onClose={() => {
          void navigate({ to: "/monsters" });
        }}
      />
    </MenuScreen>
  );
};

export default ItemListPage;
