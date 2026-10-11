package com.ficklewolf.k.weather.adapter.persistence

import com.ficklewolf.k.weather.application.DailyWeatherRepository
import com.ficklewolf.k.weather.domain.DailyWeather
import java.time.LocalDate
import java.util.concurrent.ConcurrentHashMap

class InMemoryDailyWeatherRepository : DailyWeatherRepository {
    private val dailyWeathers = ConcurrentHashMap<LocalDate, DailyWeather>()

    override fun findByDate(date: LocalDate): DailyWeather? = dailyWeathers[date]

    override fun saveIfAbsent(dailyWeather: DailyWeather): DailyWeather =
        dailyWeathers.putIfAbsent(dailyWeather.date, dailyWeather) ?: dailyWeather
}
