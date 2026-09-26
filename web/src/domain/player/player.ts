/** プレイヤー（ログイン中の自分）のプロフィール */
export type PlayerModel = {
  readonly id: string;
  readonly name: string;
  readonly level: number;
  /** 所持しているお札の数 */
  readonly fuda: number;
  /** 出撃キャラの ID（spec/master/characters.json の id） */
  readonly selectedCharacterId: string;
};

/** ゲストアカウントを作る */
export type CreateGuestCommand = {
  /** `normalizePlayerName` で確かめた名前 */
  readonly name: string;
};

/** プロフィールを変える。送った項目だけを変える（1 項目以上） */
export type UpdatePlayerCommand = {
  /** `normalizePlayerName` で確かめた名前 */
  readonly name?: string;
  /** 所持しているキャラの ID */
  readonly selectedCharacterId?: string;
};
