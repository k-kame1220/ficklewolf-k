import styles from "./TabBar.module.css";

/** タブ 1 つ分 */
export type TabBarItem = {
  /** 並べるときの key */
  readonly id: string;
  readonly label: string;
  /** 今いる画面のタブなら true（太い枠になる） */
  readonly isCurrent: boolean;
  /** 押したときに呼ぶ。`null` ならまだ押せない（文字が薄くなる） */
  readonly onSelect: (() => void) | null;
};

type TabBarProps = {
  items: readonly TabBarItem[];
  /** タブの並びの名前（読み上げ用） */
  label: string;
};

/** 手描きの四角い枠を横に並べたタブ（旧作のメニューの下のボタン） */
const TabBar = (props: TabBarProps) => {
  const { items, label } = props;

  return (
    <nav className={styles.root} aria-label={label}>
      {items.map(item => (
        <button
          key={item.id}
          className={item.isCurrent ? [styles.tab, styles.current].join(" ") : styles.tab}
          type="button"
          aria-current={item.isCurrent ? "page" : undefined}
          disabled={item.onSelect === null}
          onClick={item.onSelect ?? undefined}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
};

export default TabBar;
