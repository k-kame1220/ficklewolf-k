package com.ficklewolf.k.weather.application

import com.ficklewolf.k.weather.domain.DailyWeather
import com.ficklewolf.k.weather.domain.TodayWeather
import com.ficklewolf.k.weather.domain.Weather
import java.time.Clock
import java.time.LocalDate
import java.time.ZoneId
import kotlin.random.Random

interface WeatherService {
    fun getTodayWeather(): TodayWeather
}

fun weatherService(
    weatherRepository: WeatherRepository,
    dailyWeatherRepository: DailyWeatherRepository,
    clock: Clock,
    random: Random,
): WeatherService = DefaultWeatherService(weatherRepository, dailyWeatherRepository, clock, random)

internal class DefaultWeatherService(
    private val weatherRepository: WeatherRepository,
    private val dailyWeatherRepository: DailyWeatherRepository,
    private val clock: Clock,
    private val random: Random,
) : WeatherService {
    override fun getTodayWeather(): TodayWeather {
        val today = LocalDate.now(clock.withZone(JST))
        val daily =
            dailyWeatherRepository.findByDate(today)
                ?: dailyWeatherRepository.saveIfAbsent(DailyWeather(today, drawWeather().id))
        val weather =
            weatherRepository.findById(daily.weatherId) ?: error("weather not found: ${daily.weatherId.value}")
        return TodayWeather(today, weather)
    }

    private fun drawWeather(): Weather {
        val weathers = weatherRepository.listAll()
        val target = random.nextInt(weathers.sumOf { it.weight })
        val upperBounds = weathers.runningFold(0) { sum, weather -> sum + weather.weight }.drop(1)
        return weathers[upperBounds.indexOfFirst { target < it }]
    }

    private companion object {
        val JST: ZoneId = ZoneId.of("Asia/Tokyo")
    }
}
