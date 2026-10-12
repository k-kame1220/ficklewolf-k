import { useState } from "react";

import Button from "@/shared/ui/Button";

import { useBattleActions } from "../hooks/useBattleActions";
import { BATTLE_MESSAGES } from "../messages";
import { useBattleStore } from "../store";

import styles from "./Battle.module.css";

/**
 * コマンド（攻撃・バフ・防御・チェック・リターン・必殺技）。バフを押すと、攻撃バフ・防御バフを選ぶ。
 * 入力を待っているときだけ押せる。チェック・リターン・必殺技は次の PR で作る。
 */
const BattleCommands = () => {
  const uiPhase = useBattleStore(state => state.uiPhase);
  const phase = useBattleStore(state => state.battle.phase);
  const { send } = useBattleActions();
  const [isChoosingBuff, setIsChoosingBuff] = useState(false);
  const isDisabled = uiPhase !== "idle" || phase !== "command";

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
      <Button variant="pencil" isDisabled>
        {BATTLE_MESSAGES.check}
      </Button>
      <Button variant="pencil" isDisabled>
        {BATTLE_MESSAGES.rewind}
      </Button>
      <Button variant="pencil" isDisabled>
        {BATTLE_MESSAGES.special}
      </Button>
    </div>
  );
};

export default BattleCommands;
