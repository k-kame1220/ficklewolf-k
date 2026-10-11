import type { Attribute } from "../attribute/attribute";

/** 今日の天気（全プレイヤー共通。`GET /weather/today`） */
export type TodayWeatherModel = {
  /** 日本時間の今日の日付（`YYYY-MM-DD`） */
  readonly date: string;
  readonly id: string;
  /** 画面に出す天気の名前（「雨」など） */
  readonly name: string;
  /** この属性のキャラに天気のボーナスが付く */
  readonly attribute: Attribute;
};
