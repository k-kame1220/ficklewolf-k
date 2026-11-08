import { useState } from "react";

import type { SpecialAction } from "@/domain/battle/battle";
import Button from "@/shared/ui/Button";

import { useBattleActions } from "../hooks/useBattleActions";
import { BATTLE_MESSAGES, SPECIAL_ACTION_NAMES } from "../messages";
import { useBattleStore } from "../store";

import styles from "./Battle.module.css";

/** 必殺技で書き換えられる行動（旧作のボタンの並び） */
const SPECIAL_ACTIONS: readonly SpecialAction[] = ["attack", "provocation", "defend", "attackBuff", "defenceBuff"];

/**
 * コマンド（攻撃・バフ・防御・チェック・リターン・必殺技）。バフを押すと、攻撃バフ・防御バフを選ぶ。
 * 入力を待っているときだけ押せる。チェック・リターン・必殺技は api の残り回数と条件で押せるかを決める。
 * 必殺技で書き換えるターンを選んでいる間は、書き換える行動のボタンに替わる。
 */
const BattleCommands = () => {
  const uiPhase = useBattleStore(state => state.uiPhase);
  const phase = useBattleStore(state => state.battle.phase);
  const turn = useBattleStore(state => state.battle.turn);
  const checkpoints = useBattleStore(state => state.battle.checkpoints);
  const player = useBattleStore(state => state.battle.player);
  const tactic = useBattleStore(state => state.tactic);
  const openRewind = useBattleStore(state => state.openRewind);
  const selectSpecialAction = useBattleStore(state => state.selectSpecialAction);
  const { send, openSpecial } = useBattleActions();
  const [isChoosingBuff, setIsChoosingBuff] = useState(false);
  const isChoosingTarget = tactic?.type === "rewind" || tactic?.type === "special";
  const isDisabled = uiPhase !== "idle" || phase !== "command" || isChoosingTarget;
  const canCheck = turn > 1 && player.checkRemaining > 0 && !new Set(checkpoints).has(turn);
  const canRewind = player.rewindRemaining > 0 && checkpoints.filter(checkpoint => checkpoint !== turn).length > 0;

  if (tactic?.type === "special") {
    return (
      <div className={styles.specialActions} role="group" aria-label={BATTLE_MESSAGES.specialActions}>
        {SPECIAL_ACTIONS.map(action => (
          <Button
            key={action}
            variant="pencil"
            isDisabled={uiPhase !== "idle" || tactic.turn === null}
            onClick={() => {
              selectSpecialAction(action);
            }}
          >
            {SPECIAL_ACTION_NAMES[action]}
          </Button>
        ))}
      </div>
    );
  }

  if (isChoosingBuff) {
    return (
      <div className={styles.buffChoices} role="group" aria-label={BATTLE_MESSAGES.buff}>
        <Button
          variant="pencil"
          isDisabled={isDisabled}
          onClick={() => {
            setIsChoosingBuff(false);
            send({ type: "attackBuff" });
          }}
        >
          {BATTLE_MESSAGES.attackBuff}
        </Button>
        <Button
          variant="pencil"
          isDisabled={isDisabled}
          onClick={() => {
            setIsChoosingBuff(false);
            send({ type: "defenceBuff" });
          }}
        >
          {BATTLE_MESSAGES.defenceBuff}
        </Button>
        <button
          className={styles.textButton}
          type="button"
          onClick={() => {
            setIsChoosingBuff(false);
          }}
        >
          {BATTLE_MESSAGES.back}
        </button>
      </div>
    );
  }

  return (
    <div className={styles.commands} role="group" aria-label={BATTLE_MESSAGES.commands}>
      <Button
        variant="pencil"
        isDisabled={isDisabled}
        onClick={() => {
          send({ type: "attack" });
        }}
      >
        {BATTLE_MESSAGES.attack}
      </Button>
      <Button
        variant="pencil"
        isDisabled={isDisabled}
        onClick={() => {
          setIsChoosingBuff(true);
        }}
      >
        {BATTLE_MESSAGES.buff}
      </Button>
      <Button
        variant="pencil"
        isDisabled={isDisabled}
        onClick={() => {
          send({ type: "defend" });
        }}
      >
        {BATTLE_MESSAGES.defend}
      </Button>
      <Button
        variant="pencil"
        isDisabled={isDisabled || !canCheck}
        onClick={() => {
          send({ type: "check" });
        }}
      >
        {BATTLE_MESSAGES.check}
      </Button>
      <Button variant="pencil" isDisabled={isDisabled || !canRewind} onClick={openRewind}>
        {BATTLE_MESSAGES.rewind}
      </Button>
      <Button variant="pencil" isDisabled={isDisabled || !player.isSpecialAvailable} onClick={openSpecial}>
        {BATTLE_MESSAGES.special}
      </Button>
    </div>
  );
};

export default BattleCommands;
