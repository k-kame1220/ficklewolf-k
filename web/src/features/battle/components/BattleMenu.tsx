import { useState } from "react";

import Button from "@/shared/ui/Button";
import Panel from "@/shared/ui/Panel";

import { useBattleActions } from "../hooks/useBattleActions";
import { BATTLE_MESSAGES, COMMAND_NAMES, ENEMY_ACTION_NAMES } from "../messages";
import { useBattleStore } from "../store";

import styles from "./Battle.module.css";

type BattleMenuProps = {
  /** 「もどる」で呼ぶ（メニューを閉じる） */
  onClose: () => void;
};

/** バトルのメニュー（ログ・リタイア・もどる）。バトルの上に重ねて出す */
const BattleMenu = (props: BattleMenuProps) => {
  const { onClose } = props;
  const history = useBattleStore(state => state.battle.history);
  const enemyName = useBattleStore(state => state.enemyName);
  const playerName = useBattleStore(state => state.battle.player.name);
  const uiPhase = useBattleStore(state => state.uiPhase);
  const { retire } = useBattleActions();
  const [view, setView] = useState<"menu" | "log" | "retire">("menu");

  const content = (() => {
    if (view === "log") {
      return (
        <>
          <h2 className={styles.panelTitle}>{BATTLE_MESSAGES.log}</h2>
          {history.length === 0 ? (
            <p>{BATTLE_MESSAGES.logEmpty}</p>
          ) : (
            <ol className={styles.log}>
              {history.map(entry => (
                <li key={`${String(entry.stage)}-${String(entry.turn)}`}>
                  <span>{`${String(entry.turn)}${BATTLE_MESSAGES.turn}`}</span>
                  <span>{`${playerName}：${entry.command === null ? "―" : COMMAND_NAMES[entry.command]}`}</span>
                  <span>{`${enemyName}：${ENEMY_ACTION_NAMES[entry.enemyAction]}`}</span>
                </li>
              ))}
            </ol>
          )}
          <Button
            variant="pencil"
            onClick={() => {
              setView("menu");
            }}
          >
            {BATTLE_MESSAGES.back}
          </Button>
        </>
      );
    }
    if (view === "retire") {
      return (
        <>
          <p>{BATTLE_MESSAGES.retireConfirm}</p>
          <Button variant="bold" isDisabled={uiPhase !== "idle"} onClick={retire}>
            {BATTLE_MESSAGES.retireYes}
          </Button>
          <Button
            variant="pencil"
            onClick={() => {
              setView("menu");
            }}
          >
            {BATTLE_MESSAGES.back}
          </Button>
        </>
      );
    }
    return (
      <>
        <Button
          variant="pencil"
          onClick={() => {
            setView("log");
          }}
        >
          {BATTLE_MESSAGES.log}
        </Button>
        <Button
          variant="pencil"
          isDisabled={uiPhase !== "idle"}
          onClick={() => {
            setView("retire");
          }}
        >
          {BATTLE_MESSAGES.retire}
        </Button>
        <Button variant="pencil" onClick={onClose}>
          {BATTLE_MESSAGES.back}
        </Button>
      </>
    );
  })();

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={BATTLE_MESSAGES.menu}>
      <Panel>{content}</Panel>
    </div>
  );
};

export default BattleMenu;
