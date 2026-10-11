package com.ficklewolf.k.weather.adapter

import com.ficklewolf.k.weather.adapter.persistence.ClasspathWeatherRepository
import com.ficklewolf.k.weather.adapter.persistence.InMemoryDailyWeatherRepository
import com.ficklewolf.k.weather.application.DailyWeatherRepository
import com.ficklewolf.k.weather.application.WeatherRepository
import com.ficklewolf.k.weather.application.WeatherService
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import tools.jackson.databind.json.JsonMapper
import java.time.Clock
import kotlin.random.Random
import com.ficklewolf.k.weather.application.weatherService as createWeatherService

@Configuration
class WeatherConfiguration {
    @Bean
    fun weatherRepository(jsonMapper: JsonMapper): WeatherRepository = ClasspathWeatherRepository(jsonMapper)

    @Bean
    fun dailyWeatherRepository(): DailyWeatherRepository = InMemoryDailyWeatherRepository()

    @Bean
    fun weatherService(
        weatherRepository: WeatherRepository,
        dailyWeatherRepository: DailyWeatherRepository,
    ): WeatherService =
        createWeatherService(weatherRepository, dailyWeatherRepository, Clock.systemUTC(), Random.Default)
}
