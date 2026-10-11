import { useMyCharacters } from "@/api/character/character.query";
import { ApiError } from "@/api/core/apiError";
import { useMe } from "@/api/me/me.query";
import { useMyQuests } from "@/api/quest/quest.query";
import { attackMultiplier, NEUTRAL_MULTIPLIER } from "@/domain/attribute/attribute";
import { remoteAssetUrl } from "@/shared/assets/remoteAsset";
import Button from "@/shared/ui/Button";

import { QUEST_LIST_MESSAGES } from "../messages";

import styles from "./SortieConfirm.module.css";

type SortieConfirmProps = {
  questId: string;
  /** 挑戦できないクエストだったときの「もどる」で呼ぶ */
  onBack: () => void;
};

/**
 * 出撃確認（S-05）。敵と出撃キャラを並べ、属性の相性を出す。
 * 「戦う」はバトル画面ができるまで押せない。まだクリアしていない敵は黒いシルエット（旧作どおり）。
 */
const SortieConfirm = (props: SortieConfirmProps) => {
  const { questId, onBack } = props;
  const quests = useMyQuests();
  const me = useMe();
  const characters = useMyCharacters();

  if (quests.error instanceof ApiError || me.error instanceof ApiError || characters.error instanceof ApiError) {
    return null;
  }
  if (quests.isError || me.isError || characters.isError) {
    return (
      <div className={styles.status}>
        <p role="alert">{QUEST_LIST_MESSAGES.networkError}</p>
        <Button
          variant="pencil"
          onClick={() => {
            void quests.refetch();
            void me.refetch();
            void characters.refetch();
          }}
        >
          {QUEST_LIST_MESSAGES.retry}
        </Button>
      </div>
    );
  }
  if (quests.isPending || me.isPending || characters.isPending) {
    return <p className={styles.status}>{QUEST_LIST_MESSAGES.loading}</p>;
  }

  const quest = quests.data.get(questId);
  if (quest === undefined) {
    return (
      <div className={styles.status}>
        <p>{QUEST_LIST_MESSAGES.notFound}</p>
        <Button variant="pencil" onClick={onBack}>
          {QUEST_LIST_MESSAGES.back}
        </Button>
      </div>
    );
  }

  const character = characters.data.get(me.data.selectedCharacterId);
  const enemyImageUrl = remoteAssetUrl(quest.imageKey);
  const characterImageUrl = character === undefined ? null : remoteAssetUrl(character.assets.main);
  const affinity = (() => {
    if (character === undefined) return null;
    const multiplier = attackMultiplier(character.attribute, quest.attribute);
    if (multiplier > NEUTRAL_MULTIPLIER) return QUEST_LIST_MESSAGES.advantage;
    if (multiplier < NEUTRAL_MULTIPLIER) return QUEST_LIST_MESSAGES.disadvantage;
    return QUEST_LIST_MESSAGES.neutral;
  })();

  return (
    <div className={styles.root}>
      <section className={styles.side} aria-label={QUEST_LIST_MESSAGES.enemy}>
        <h2 className={styles.label}>{QUEST_LIST_MESSAGES.enemy}</h2>
        <div className={styles.row}>
          <p className={styles.name}>{quest.name}</p>
          <div className={styles.frame}>
            {enemyImageUrl !== null && (
              <img
                className={quest.isCleared ? styles.image : [styles.image, styles.silhouette].join(" ")}
                src={enemyImageUrl}
                alt={quest.name}
              />
            )}
          </div>
        </div>
      </section>
      <section className={styles.side} aria-label={QUEST_LIST_MESSAGES.you}>
        <h2 className={styles.label}>{QUEST_LIST_MESSAGES.you}</h2>
        <div className={styles.row}>
          <p className={styles.name}>{character?.name ?? me.data.selectedCharacterId}</p>
          <div className={styles.frame}>
            {characterImageUrl !== null && (
              <img className={styles.image} src={characterImageUrl} alt={character?.name ?? ""} />
            )}
          </div>
        </div>
      </section>
      {affinity !== null && <p className={styles.affinity}>{`${QUEST_LIST_MESSAGES.affinity}${affinity}`}</p>}
      <Button variant="bold" isDisabled>
        {QUEST_LIST_MESSAGES.fight}
      </Button>
    </div>
  );
};

export default SortieConfirm;
