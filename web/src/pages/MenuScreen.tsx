import { useNavigate } from "@tanstack/react-router";

import { HomeStatus } from "@/features/home";
import { MenuTabs } from "@/features/menu";
import type { MenuTabId } from "@/features/menu";
import MenuLayout from "@/shared/ui/MenuLayout";

import type { ReactNode } from "react";

const MENU_TAB_PATHS = new Map<MenuTabId, "/quests" | "/home">([
  ["quest", "/quests"],
  ["home", "/home"]
]);

type MenuScreenProps = {
  /** 今いる画面のタブ */
  current: MenuTabId;
  children: ReactNode;
};

/** メニューの画面（上にプレイヤーの状態、下にタブ）。タブを押したらその画面へ移る */
const MenuScreen = (props: MenuScreenProps) => {
  const { current, children } = props;
  const navigate = useNavigate();

  return (
    <MenuLayout
      header={<HomeStatus />}
      footer={
        <MenuTabs
          current={current}
          onSelect={id => {
            const to = MENU_TAB_PATHS.get(id);
            if (to !== undefined) void navigate({ to });
          }}
        />
      }
    >
      {children}
    </MenuLayout>
  );
};

export default MenuScreen;
