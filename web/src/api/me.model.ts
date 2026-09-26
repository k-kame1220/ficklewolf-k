import type { components } from "./generated/schema";

/** 自分のプロフィール */
export type MeModel = {
  readonly id: string;
  readonly name: string;
  readonly level: number;
  /** 所持しているお札の数 */
  readonly fuda: number;
  /** 出撃キャラの ID（spec/master/characters.json の id） */
  readonly selectedCharacterId: string;
};

/** api のレスポンスから MeModel を作る */
export const toMeModel = (dto: components["schemas"]["Me"]): MeModel => ({
  id: dto.id,
  name: dto.name,
  level: dto.level,
  fuda: dto.fuda,
  selectedCharacterId: dto.selectedCharacterId
});
