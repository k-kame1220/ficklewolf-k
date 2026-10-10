import type { Attribute } from "../attribute/attribute";

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
};
