import type { Attribute } from "../attribute/attribute";

/** ステータスごとの数（HP・攻撃・防御） */
export type StatCountsModel = {
  readonly hp: number;
  readonly attack: number;
  readonly defence: number;
};

/** ステータス 1 つの内訳。`total = base + bonus.item + bonus.duplicate + bonus.weather` */
export type StatBreakdownModel = {
  /** キャラの基礎の値 */
  readonly base: number;
  readonly bonus: {
    /** アイテムで上がった分 */
    readonly item: number;
    /** 被りで上がった分 */
    readonly duplicate: number;
    /** 今日の天気のボーナス（天気と同じ属性のときだけ） */
    readonly weather: number;
  };
  readonly total: number;
};

/** 所持キャラ（`GET /me/characters` の 1 件） */
export type MyCharacterModel = {
  readonly id: string;
  readonly name: string;
  readonly attribute: Attribute;
  readonly description: string;
  /** 素材のキー（URL は `remoteAssetUrl` で作る） */
  readonly assets: {
    readonly main: string;
    readonly icon: string;
    readonly home: string;
  };
  /** 今のステータス（今日の天気のボーナス込み） */
  readonly stats: {
    readonly hp: StatBreakdownModel;
    readonly attack: StatBreakdownModel;
    readonly defence: StatBreakdownModel;
  };
  /** 強化で使ったアイテムの個数 */
  readonly itemUses: StatCountsModel;
  /** 強化で使えるアイテムの上限（全キャラ共通） */
  readonly itemUseMax: StatCountsModel;
};
