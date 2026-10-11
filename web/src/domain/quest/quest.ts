import type { Attribute } from "../attribute/attribute";

/** クエストの種類（メイン・イベント・お天気） */
export const QUEST_KINDS = ["main", "event", "weather"] as const;

/** クエストの種類（メイン・イベント・お天気）。イベントはフェーズ 1.5 から */
export type QuestKind = (typeof QUEST_KINDS)[number];

/** 挑戦できるクエスト（`GET /me/quests` の 1 件） */
export type MyQuestModel = {
  readonly id: string;
  readonly kind: QuestKind;
  readonly name: string;
  /** 敵の画像のキー（最初のステージ。URL は `remoteAssetUrl` で作る） */
  readonly imageKey: string;
  /** 敵の属性（最初のステージ） */
  readonly attribute: Attribute;
  /** 敵の数（2 以上なら連戦） */
  readonly stageCount: number;
  /** 最初の敵のターン数 */
  readonly turnCount: number;
  /** みえーるみえーるを使える回数 */
  readonly revealCount: number;
  /** 一度でもクリアしたか */
  readonly isCleared: boolean;
};
