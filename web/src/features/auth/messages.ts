import type { PlayerNameRejectReason } from "@/domain/player/name";

/** 名前登録の文言 */
export const REGISTER_MESSAGES = {
  label: "なまえを教えて(6文字まで)",
  submit: "決定",
  accountLost: "データが見つかりませんでした。なまえを決めてはじめからあそんでください。",
  invalidName: "このなまえは使えません",
  networkError: "通信エラーが発生しました。電波の良いところでリトライしてください。"
} as const;

/** 名前が使えない理由ごとの文言 */
export const NAME_REJECT_MESSAGES = {
  EMPTY: "なまえを入れてください",
  TOO_LONG: "なまえは6文字までです",
  CONTROL_CHARACTER: "なまえに使えない文字が入っています"
} as const satisfies Record<PlayerNameRejectReason, string>;
