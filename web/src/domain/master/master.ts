import type { Attribute } from "../attribute/attribute";
import type { EnemySetup, PlayerSetup } from "../battle/types";

/** HP・攻撃・防御の組 */
export type StatsModel = {
  readonly hp: number;
  readonly attack: number;
  readonly defence: number;
};

/** ステータスの種類 */
export type Stat = keyof StatsModel;

/** 属性のマスタ */
export type AttributeModel = {
  readonly id: Attribute;
  /** 表示名（陽・音・月） */
  readonly name: string;
  /** この属性が有利な相手 */
  readonly strongAgainst: Attribute;
  readonly iconKey: string;
  /** この属性の敵と戦うときの BGM */
  readonly bgmKey: string;
};

/** キャラのマスタ */
export type CharacterModel = {
  readonly id: string;
  /** 図鑑の番号（1 始まり） */
  readonly no: number;
  readonly name: string;
  readonly category: "main" | "event" | "gacha" | "other";
  readonly attribute: Attribute;
  readonly description: string;
  /** 基礎ステータス（育成・天気を足す前） */
  readonly base: Omit<PlayerSetup, "attribute">;
  /** 被りで増やせる上限 */
  readonly duplicateBonusMax: StatsModel;
  readonly assets: {
    readonly main: string;
    readonly icon: string;
    readonly home: string;
  };
};

/** クエストの 1 戦分（連戦なら複数） */
export type QuestStageModel = {
  readonly name: string;
  readonly imageKey: string;
  /** 敵のバトル用の値（バトルエンジンにそのまま渡す） */
  readonly battle: EnemySetup;
  /** みえーるみえーるを使える回数 */
  readonly revealCount: number;
};

/** クエストのマスタ */
export type QuestModel = {
  readonly id: string;
  readonly kind: "main" | "event" | "weather";
  readonly name: string;
  /** 同じ種類の中での並び（1 始まり）。メインクエストは解放の順番 */
  readonly order: number;
  /** お天気クエストのときの天気。それ以外は null */
  readonly weatherId: string | null;
  readonly bannerKey: string | null;
  readonly bgmKey: string | null;
  /** 戦う順番。2 つ以上なら連戦 */
  readonly stages: readonly [QuestStageModel, ...QuestStageModel[]];
  readonly rewards: {
    /** 仲間になるキャラ。いなければ null */
    readonly recruit: string | null;
    /** お天気のアイテムが出るか */
    readonly weatherItems: boolean;
  };
};

/** 天気のマスタ */
export type WeatherModel = {
  readonly id: string;
  readonly name: string;
  readonly attribute: Attribute;
  /** 毎日の抽選の重み */
  readonly weight: number;
  /** 同じ属性のキャラに足すステータス */
  readonly bonus: StatsModel;
  /** この天気のときに挑戦できるクエスト */
  readonly questId: string;
};

/** 強化アイテムのマスタ */
export type ItemModel = {
  readonly id: string;
  readonly name: string;
  readonly attribute: Attribute;
  /** 上げるステータス */
  readonly stat: Stat;
  readonly iconKey: string;
};

/** 成長・報酬などの設定 */
export type SettingsModel = {
  /** 必要なアプリの最低バージョン */
  readonly minAppVersion: string;
  /** アカウント作成時に持っているキャラ */
  readonly starterCharacterId: string;
  readonly growth: {
    /** アイテムを使える上限の個数 */
    readonly itemUseMax: StatsModel;
    /** アイテム 1 個で上がる値 */
    readonly itemBonusPerUse: StatsModel;
    /** 被りカウント 1 つで上がる値 */
    readonly duplicateBonusPerCount: StatsModel;
  };
  readonly rewards: {
    readonly firstClearRecruitRate: number;
    readonly repeatRecruitRate: number;
    readonly weatherItemDropMin: number;
    readonly weatherItemDropMax: number;
    readonly fudaPerEvenLevel: number;
  };
};

/** マスタデータ一式。各マスタは ID で引ける Map（並びは spec/master の JSON の順） */
export type MasterModel = {
  /** マスタのバージョン */
  readonly version: string;
  readonly attributes: ReadonlyMap<Attribute, AttributeModel>;
  readonly characters: ReadonlyMap<string, CharacterModel>;
  readonly quests: ReadonlyMap<string, QuestModel>;
  readonly weathers: ReadonlyMap<string, WeatherModel>;
  readonly items: ReadonlyMap<string, ItemModel>;
  readonly settings: SettingsModel;
};
