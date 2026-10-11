import { queryOptions, useQuery } from "@tanstack/react-query";

import { apiClient } from "@/api/core/client";
import { parseResponse } from "@/api/core/response";
import type { TodayWeatherModel } from "@/domain/weather/weather";

import { weatherKeys } from "./weather.keys";
import { todayWeatherToDomain } from "./weather.mapper";
import { TodayWeatherResponseSchema } from "./weather.schema";

/** 今日の天気を取る。失敗したら ApiError / InvalidResponseError を投げる */
export const fetchTodayWeather = async (): Promise<TodayWeatherModel> => {
  const result = await apiClient.GET("/weather/today");
  const body = parseResponse(result, TodayWeatherResponseSchema);
  return todayWeatherToDomain(body);
};

/** 今日の天気のクエリ */
export const todayWeatherQueryOptions = queryOptions({ queryKey: weatherKeys.today, queryFn: fetchTodayWeather });

/** 今日の天気 */
export const useTodayWeather = () => useQuery(todayWeatherQueryOptions);
