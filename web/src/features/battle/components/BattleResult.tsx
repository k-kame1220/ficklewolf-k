import { useState } from "react";

import { useMyCharacters } from "@/api/character/character.query";
import { remoteAssetUrl } from "@/shared/assets/remoteAsset";

import { BATTLE_MESSAGES } from "../messages";
import { useBattleStore } from "../store";

import styles from "./Battle.module.css";

/** 結果の画面の行き先 */
export type BattleExit = "home" | "quests";

type BattleResultProps = {
  /** 最後のページをタップしたときに呼ぶ（勝ち: ホーム、負け: クエストの一覧） */
  onExit: (exit: BattleExit) => void;
};

type ResultPage = {
  readonly key: string;
  readonly title: string | null;
  readonly text: string | null;
  readonly imageKey: string | null;
};

/** 決着の画面（勝ち: STAGE CLEAR → 仲間 → Lv アップ → お札、負け: LOSE）。タップで次へ進む */
const BattleResult = (props: BattleResultProps) => {
  const { onExit } = props;
  const outcome = useBattleStore(state => state.battle.outcome);
  const reward = useBattleStore(state => state.reward);
  const characters = useMyCharacters();
  const [index, setIndex] = useState(0);

  const pages = ((): readonly ResultPage[] => {
    if (outcome !== "win") return [{ key: "lose", title: BATTLE_MESSAGES.lose, text: null, imageKey: null }];
    const recruited =
      reward?.recruitedCharacterId === null || reward?.recruitedCharacterId === undefined
        ? undefined
        : characters.data?.get(reward.recruitedCharacterId);
    return [
      { key: "clear", title: BATTLE_MESSAGES.stageClear, text: null, imageKey: null },
      ...(recruited === undefined
        ? []
        : [
            {
              key: "recruit",
              title: null,
              text: `${recruited.name}をゲットしました。`,
              imageKey: recruited.assets.main
            }
          ]),
      ...(reward?.isLevelUp === true
        ? [{ key: "level", title: BATTLE_MESSAGES.levelUp, text: null, imageKey: null }]
        : []),
      ...(reward !== null && reward.fudaGained > 0
        ? [{ key: "fuda", title: null, text: BATTLE_MESSAGES.fudaGained, imageKey: null }]
        : [])
    ];
  })();
  const page = pages[Math.min(index, pages.length - 1)];
  const imageUrl = page?.imageKey === null || page?.imageKey === undefined ? null : remoteAssetUrl(page.imageKey);

  return (
    <button
      className={styles.result}
      type="button"
      onClick={() => {
        if (index + 1 < pages.length) {
          setIndex(index + 1);
          return;
        }
        onExit(outcome === "win" ? "home" : "quests");
      }}
    >
      {page?.title !== null && <span className={styles.resultTitle}>{page?.title}</span>}
      {imageUrl !== null && <img className={styles.resultImage} src={imageUrl} alt="" />}
      {page?.text !== null && <span className={styles.resultText}>{page?.text}</span>}
      <span className={styles.visuallyHidden}>{BATTLE_MESSAGES.tapToNext}</span>
    </button>
  );
};

export default BattleResult;
