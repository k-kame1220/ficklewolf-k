/** プレイヤー名の最大文字数（コードポイント単位） */
export const PLAYER_NAME_MAX_LENGTH = 6;

const CONTROL_CHARACTER = /\p{Cc}/u;

/** プレイヤー名として使えない理由 */
export type PlayerNameRejectReason = "EMPTY" | "TOO_LONG" | "CONTROL_CHARACTER";

/** プレイヤー名の確認結果。使えるときは前後の空白を除いた名前を返す */
export type PlayerNameResult =
  { readonly ok: true; readonly name: string } | { readonly ok: false; readonly reason: PlayerNameRejectReason };

/**
 * 入力されたプレイヤー名を確かめる（spec/openapi の PlayerName と同じ判定）。
 * 前後の空白を除き、コードポイント単位で 1〜6 文字、制御文字なし。
 */
export const normalizePlayerName = (raw: string): PlayerNameResult => {
  const name = raw.trim();
  if (name.length === 0) return { ok: false, reason: "EMPTY" };
  // eslint-disable-next-line @typescript-eslint/no-misused-spread -- spec の PlayerName はコードポイント単位で数える
  if ([...name].length > PLAYER_NAME_MAX_LENGTH) return { ok: false, reason: "TOO_LONG" };
  if (CONTROL_CHARACTER.test(name)) return { ok: false, reason: "CONTROL_CHARACTER" };
  return { ok: true, name };
};
