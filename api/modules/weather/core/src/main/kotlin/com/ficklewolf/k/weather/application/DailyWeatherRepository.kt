package com.ficklewolf.k.weather.application

import com.ficklewolf.k.weather.domain.DailyWeather
import java.time.LocalDate

interface DailyWeatherRepository {
    fun findByDate(date: LocalDate): DailyWeather?

    fun saveIfAbsent(dailyWeather: DailyWeather): DailyWeather
}
