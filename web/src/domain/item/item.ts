import type { Attribute } from "../attribute/attribute";
import type { Stat } from "../stat/stat";

/** 所持アイテム（`GET /me/items` の 1 件）。個数は 1 以上 */
export type MyItemModel = {
  readonly id: string;
  readonly name: string;
  /** 使えるのは同じ属性のキャラだけ */
  readonly attribute: Attribute;
  /** 上がるステータス */
  readonly stat: Stat;
  /** アイコンの素材のキー（URL は `remoteAssetUrl` で作る） */
  readonly iconKey: string;
  readonly count: number;
};
