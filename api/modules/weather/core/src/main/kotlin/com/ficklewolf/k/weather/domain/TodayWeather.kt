package com.ficklewolf.k.weather.domain

import java.time.LocalDate

data class TodayWeather(
    val date: LocalDate,
    val weather: Weather,
)
