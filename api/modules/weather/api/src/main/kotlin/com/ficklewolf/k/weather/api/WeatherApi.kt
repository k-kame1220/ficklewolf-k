package com.ficklewolf.k.weather.api

interface WeatherApi {
    fun getToday(): TodayWeatherSummary
}
