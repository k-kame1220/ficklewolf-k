import TabBar from "@/shared/ui/TabBar";

import { MENU_MESSAGES } from "../messages";

/** メニューのタブ（旧作と同じ並び） */
export type MenuTabId = "quest" | "monster" | "home" | "gacha" | "other";

const MENU_TAB_IDS = ["quest", "monster", "home", "gacha", "other"] as const satisfies readonly MenuTabId[];

const AVAILABLE_TAB_IDS: ReadonlySet<MenuTabId> = new Set(["quest", "home"]);

type MenuTabsProps = {
  /** 今いる画面のタブ */
  current: MenuTabId;
  /** タブを押したときに呼ぶ（画面がまだないタブは押せない） */
  onSelect: (id: MenuTabId) => void;
};

const MenuTabs = (props: MenuTabsProps) => {
  const { current, onSelect } = props;

  const items = MENU_TAB_IDS.map(id => ({
    id,
    label: MENU_MESSAGES[id],
    isCurrent: id === current,
    onSelect: AVAILABLE_TAB_IDS.has(id)
      ? () => {
          onSelect(id);
        }
      : null
  }));

  return <TabBar items={items} label={MENU_MESSAGES.tabs} />;
};

export default MenuTabs;
