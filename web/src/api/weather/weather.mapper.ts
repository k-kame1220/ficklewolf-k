import type { components } from "@/api/generated/schema";
import type { TodayWeatherModel } from "@/domain/weather/weather";

/** api の `TodayWeather` をアプリの型にする */
export const todayWeatherToDomain = (response: components["schemas"]["TodayWeather"]): TodayWeatherModel => ({
  date: response.date,
  id: response.id,
  name: response.name,
  attribute: response.attribute
});
