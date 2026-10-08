import logoK from "./bundled/logo-k.webp";
import titleEmblem from "./bundled/title-emblem.webp";

/** 画面に `<img>` で出す同梱素材の URL（背景や枠は `shared/styles/tokens.css` の変数で使う） */
export const BUNDLED_ASSETS = {
  /** 赤い「K」（読み込み中の画面） */
  logoK,
  /** タイトルの紋（「ターン式タイムリターンバトル」の文字入り） */
  titleEmblem
} as const;
