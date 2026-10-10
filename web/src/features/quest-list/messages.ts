import type { Attribute } from "@/domain/attribute/attribute";

/** クエストを選ぶ画面の文言 */
export const QUEST_LIST_MESSAGES = {
  loading: "よみこみ中…",
  networkError: "通信エラーが発生しました。電波の良いところでリトライしてください。",
  retry: "リトライ",
  menu: "クエスト",
  main: "メインクエスト",
  event: "イベントクエスト",
  empty: "挑戦できるクエストはありません。",
  materialQuest: "素材クエスト",
  enemy: "敵",
  you: "あなた",
  affinity: "相性：",
  advantage: "有利",
  disadvantage: "不利",
  neutral: "互角",
  fight: "戦う",
  notFound: "このクエストには挑戦できません。",
  back: "もどる"
} as const;

/** 属性の表示名 */
export const ATTRIBUTE_LABELS = {
  yang: "陽",
  note: "音",
  moon: "月"
} as const satisfies Record<Attribute, string>;
