import { http, HttpResponse } from "msw";
import * as v from "valibot";

import { API_BASE_URL } from "@/api/core/config";
import type { components } from "@/api/generated/schema";
import { authenticate, problem } from "@/api/mocks/db";
import type { MockDb } from "@/api/mocks/db";
import { ATTRIBUTES } from "@/domain/attribute/attribute";

const weathersRaw =
  Object.values(
    import.meta.glob<string>("../../../../spec/master/weathers.json", {
      eager: true,
      query: "?raw",
      import: "default"
    })
  )[0] ?? "null";

const HTTP_UNAUTHORIZED = 401;
const HTTP_INTERNAL_SERVER_ERROR = 500;
/** 日本時間の日付を `YYYY-MM-DD` で書く（sv-SE はこの並びで書く） */
const JST_DATE_FORMAT = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" });

const MasterWeathersSchema = v.array(
  v.object({
    id: v.string(),
    name: v.string(),
    attribute: v.picklist(ATTRIBUTES)
  })
);

/** `GET /weather/today` のモック。モックの今日の天気（`db.todayWeatherId`）を spec/master/weathers.json から返す */
export const createWeatherMockHandlers = (db: MockDb) => {
  const weathers = new Map(
    v.parse(MasterWeathersSchema, JSON.parse(weathersRaw)).map(weather => [weather.id, weather])
  );
  return [
    http.get(`${API_BASE_URL}/weather/today`, ({ request }) => {
      const me = authenticate(db, request);
      if (me === null) return problem(HTTP_UNAUTHORIZED, "UNAUTHORIZED");
      const weather = weathers.get(db.todayWeatherId);
      if (weather === undefined) return problem(HTTP_INTERNAL_SERVER_ERROR, "INTERNAL_ERROR");
      return HttpResponse.json({
        date: JST_DATE_FORMAT.format(new Date()),
        id: weather.id,
        name: weather.name,
        attribute: weather.attribute
      } satisfies components["schemas"]["TodayWeather"]);
    })
  ];
};
