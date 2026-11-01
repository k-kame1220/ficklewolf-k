package com.ficklewolf.k.weather.application

import com.ficklewolf.k.weather.api.TodayWeatherSummary
import com.ficklewolf.k.weather.api.WeatherApi

fun weatherApi(weatherService: WeatherService): WeatherApi = DefaultWeatherApi(weatherService)

internal class DefaultWeatherApi(
    private val weatherService: WeatherService,
) : WeatherApi {
    override fun getToday(): TodayWeatherSummary =
        weatherService.getTodayWeather().weather.let { TodayWeatherSummary(it.attribute, it.bonus) }
}
