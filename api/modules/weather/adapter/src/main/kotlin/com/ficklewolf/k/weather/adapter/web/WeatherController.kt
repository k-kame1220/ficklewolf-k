package com.ficklewolf.k.weather.adapter.web

import com.ficklewolf.k.weather.application.WeatherService
import com.ficklewolf.k.weather.domain.TodayWeather
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

data class TodayWeatherResponse(
    val date: String,
    val id: String,
    val name: String,
    val attribute: String,
)

@RestController
class WeatherController(
    private val weatherService: WeatherService,
) {
    @GetMapping("/weather/today")
    fun getTodayWeather(): ResponseEntity<TodayWeatherResponse> {
        val todayWeather = weatherService.getTodayWeather()
        return ResponseEntity.ok(todayWeather.toResponse())
    }
}

private fun TodayWeather.toResponse(): TodayWeatherResponse =
    TodayWeatherResponse(date.toString(), weather.id.value, weather.name, weather.attribute.value)
