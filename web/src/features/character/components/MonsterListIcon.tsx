import { useEffect, useState } from "react";

import type { MyCharacterModel } from "@/domain/character/character";
import { remoteAssetUrl } from "@/shared/assets/remoteAsset";

import styles from "./MonsterList.module.css";

import type { MouseEvent } from "react";

const LONG_PRESS_MS = 500;

type MonsterListIconProps = {
  character: MyCharacterModel;
  /** 今の出撃キャラなら true（太い枠になる） */
  isSelected: boolean;
  /** 出撃キャラを変えている途中は押せない */
  isDisabled: boolean;
  /** 短く押したとき（Enter・Space も）に呼ぶ。出撃キャラにする */
  onSelect: (characterId: string) => void;
  /** 長く押したとき（右クリック・コンテキストメニューも）に呼ぶ。詳細を開く */
  onOpenDetail: (characterId: string) => void;
};

/** 持っているキャラのアイコン。短く押すと出撃キャラにし、長く押すと詳細を開く */
const MonsterListIcon = (props: MonsterListIconProps) => {
  const { character, isSelected, isDisabled, onSelect, onOpenDetail } = props;
  const [pressTimer, setPressTimer] = useState<number | null>(null);
  const [isLongPressed, setIsLongPressed] = useState(false);

  useEffect(
    () => () => {
      if (pressTimer !== null) window.clearTimeout(pressTimer);
    },
    [pressTimer]
  );

  const iconUrl = remoteAssetUrl(character.assets.icon);
  const cancelPress = () => {
    setPressTimer(null);
  };

  return (
    <button
      className={isSelected ? [styles.icon, styles.selected].join(" ") : styles.icon}
      type="button"
      aria-pressed={isSelected}
      disabled={isDisabled}
      onPointerDown={() => {
        setIsLongPressed(false);
        setPressTimer(
          window.setTimeout(() => {
            setPressTimer(null);
            setIsLongPressed(true);
            onOpenDetail(character.id);
          }, LONG_PRESS_MS)
        );
      }}
      onPointerUp={cancelPress}
      onPointerLeave={cancelPress}
      onPointerCancel={cancelPress}
      onClick={() => {
        if (isLongPressed) {
          setIsLongPressed(false);
          return;
        }
        onSelect(character.id);
      }}
      onContextMenu={(event: MouseEvent) => {
        event.preventDefault();
        cancelPress();
        onOpenDetail(character.id);
      }}
    >
      {iconUrl === null ? character.name : <img className={styles.iconImage} src={iconUrl} alt={character.name} />}
    </button>
  );
};

export default MonsterListIcon;
