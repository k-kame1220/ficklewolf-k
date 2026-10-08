import { useState } from "react";

import { useMe } from "@/api/me/me.query";

import { HOME_MESSAGES } from "../messages";

import styles from "./HomeStatus.module.css";

const DATE_FORMAT = new Intl.DateTimeFormat("ja-JP", { dateStyle: "long" });

/** 画面の上のプレイヤーの状態（今日の日付・なまえ・Lv・御札）。読み込み中と失敗のときは何も出さない */
const HomeStatus = () => {
  const me = useMe();
  const [today] = useState(() => DATE_FORMAT.format(new Date()));

  if (!me.isSuccess) return null;

  return (
    <div className={styles.root}>
      <p className={styles.date}>{today}</p>
      <h1 className={styles.name}>{me.data.name}</h1>
      <p className={styles.level}>{`${HOME_MESSAGES.level}${String(me.data.level)}`}</p>
      <p className={styles.fuda}>
        <span>{HOME_MESSAGES.fuda}</span>
        <span>{me.data.fuda}</span>
      </p>
    </div>
  );
};

export default HomeStatus;
