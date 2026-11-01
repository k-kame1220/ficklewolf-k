import { useState } from "react";

import type { MyItemModel } from "@/domain/item/item";
import type { Stat } from "@/domain/stat/stat";
import { remoteAssetUrl } from "@/shared/assets/remoteAsset";

import { CHARACTER_MESSAGES } from "../messages";

import styles from "./MonsterDetail.module.css";

type MonsterDetailEnhanceRowProps = {
  stat: Stat;
  /** そのステータスを上げる、キャラと同じ属性の持っているアイテム */
  item: MyItemModel;
  /** 一度に使える数の上限（持っている数と、あと使える数の小さいほう） */
  max: number;
  isDisabled: boolean;
  /** 「使う」で呼ぶ。強化できたら `onDone` を呼んでもらい、個数を 0 に戻す */
  onUse: (stat: Stat, count: number, onDone: () => void) => void;
};

/** 強化の 1 行。アイテムと持っている数、使う個数（−／＋）、「使う」 */
const MonsterDetailEnhanceRow = (props: MonsterDetailEnhanceRowProps) => {
  const { stat, item, max, isDisabled, onUse } = props;
  const [count, setCount] = useState(0);

  const label = item.name;
  const iconUrl = remoteAssetUrl(item.iconKey);
  const clampedCount = Math.min(count, max);

  return (
    <li className={styles.enhanceRow}>
      <span className={styles.itemFrame}>
        {iconUrl !== null && <img className={styles.itemImage} src={iconUrl} alt="" />}
      </span>
      <span className={styles.itemLabel}>
        <span>{label}</span>
        <span className={styles.owned}>{`${String(item.count)}${CHARACTER_MESSAGES.countUnit}`}</span>
      </span>
      <span className={styles.stepper}>
        <button
          className={styles.stepButton}
          type="button"
          aria-label={`${label}を${CHARACTER_MESSAGES.decrease}`}
          disabled={isDisabled || clampedCount <= 0}
          onClick={() => {
            setCount(clampedCount - 1);
          }}
        >
          −
        </button>
        <output className={styles.count} aria-label={`${label}を使う個数`}>
          {clampedCount}
        </output>
        <button
          className={styles.stepButton}
          type="button"
          aria-label={`${label}を${CHARACTER_MESSAGES.increase}`}
          disabled={isDisabled || clampedCount >= max}
          onClick={() => {
            setCount(clampedCount + 1);
          }}
        >
          ＋
        </button>
      </span>
      <button
        className={styles.useButton}
        type="button"
        disabled={isDisabled || clampedCount <= 0}
        onClick={() => {
          onUse(stat, clampedCount, () => {
            setCount(0);
          });
        }}
      >
        {CHARACTER_MESSAGES.use}
      </button>
    </li>
  );
};

export default MonsterDetailEnhanceRow;
