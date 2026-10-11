package com.ficklewolf.k.weather.adapter.persistence

import com.ficklewolf.k.shared.kernel.WeatherId
import com.ficklewolf.k.weather.domain.DailyWeather
import java.time.LocalDate
import kotlin.test.Test
import kotlin.test.assertEquals

class InMemoryDailyWeatherRepositoryTest {
    private val repository = InMemoryDailyWeatherRepository()
    private val today = LocalDate.parse("2026-10-11")

    @Test
    fun `その日の分がなければ入れて、入れたものを返す`() {
        val rain = DailyWeather(today, WeatherId("rain"))

        assertEquals(rain, repository.saveIfAbsent(rain))
        assertEquals(rain, repository.findByDate(today))
    }

    @Test
    fun `その日の分がもうあれば入れず、先に入った方を返す`() {
        val rain = DailyWeather(today, WeatherId("rain"))
        repository.saveIfAbsent(rain)

        val second = repository.saveIfAbsent(DailyWeather(today, WeatherId("sunny")))

        assertEquals(rain, second)
        assertEquals(rain, repository.findByDate(today))
    }
}
