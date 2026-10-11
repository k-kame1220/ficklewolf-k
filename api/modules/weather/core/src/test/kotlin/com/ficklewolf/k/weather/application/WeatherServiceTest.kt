package com.ficklewolf.k.weather.application

import com.ficklewolf.k.shared.kernel.Attribute
import com.ficklewolf.k.shared.kernel.CharacterStatus
import com.ficklewolf.k.shared.kernel.WeatherId
import com.ficklewolf.k.weather.domain.DailyWeather
import com.ficklewolf.k.weather.domain.Weather
import java.time.Clock
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset
import kotlin.random.Random
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class WeatherServiceTest {
    private val blueSky = weather("blue-sky", weight = 1)
    private val sunny = weather("sunny", weight = 2)
    private val galleon = weather("galleon", weight = 1)

    private val masters = listOf(blueSky, sunny, galleon)

    private val weatherRepository =
        object : WeatherRepository {
            override fun findById(id: WeatherId): Weather? = masters.associateBy { it.id }[id]

            override fun listAll(): List<Weather> = masters
        }

    private val dailyWeathers = mutableMapOf<LocalDate, DailyWeather>()

    private val dailyWeatherRepository =
        object : DailyWeatherRepository {
            override fun findByDate(date: LocalDate): DailyWeather? = dailyWeathers[date]

            override fun saveIfAbsent(dailyWeather: DailyWeather): DailyWeather =
                dailyWeathers.getOrPut(dailyWeather.date) { dailyWeather }
        }

    /** `nextInt(until)` が、渡した値を順に返す乱数 */
    private class FixedRandom(
        vararg values: Int,
    ) : Random() {
        private val rest = ArrayDeque(values.toList())

        override fun nextBits(bitCount: Int): Int = error("使わない")

        override fun nextInt(until: Int): Int = rest.removeFirst().also { require(it in 0 until until) }
    }

    private fun service(
        now: String,
        vararg draws: Int,
    ): WeatherService =
        weatherService(
            weatherRepository,
            dailyWeatherRepository,
            Clock.fixed(Instant.parse(now), ZoneOffset.UTC),
            FixedRandom(*draws),
        )

    @Test
    fun `日付は日本時間で決まる`() {
        val today = service("2026-10-10T15:00:00Z", 0).getTodayWeather()

        assertEquals(LocalDate.parse("2026-10-11"), today.date)
    }

    @Test
    fun `重みどおりに選ぶ（重みの合計 4 のうち、0 は青空、1・2 は晴、3 はガレオン船）`() {
        val days = listOf("2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04")

        val drawn = days.mapIndexed { target, day -> service("${day}T00:00:00Z", target).getTodayWeather().weather }

        assertEquals(listOf(blueSky, sunny, sunny, galleon), drawn)
    }

    @Test
    fun `同じ日の 2 回目は抽選せず、同じ天気を返す`() {
        val service = service("2026-10-11T00:00:00Z", 0)

        val first = service.getTodayWeather()
        val second = service.getTodayWeather()

        assertEquals(first, second)
        assertEquals(blueSky, second.weather)
    }

    @Test
    fun `日付が変わると抽選し直す`() {
        service("2026-10-11T00:00:00Z", 0).getTodayWeather()

        val nextDay = service("2026-10-12T00:00:00Z", 3).getTodayWeather()

        assertEquals(galleon, nextDay.weather)
        assertEquals(setOf(LocalDate.parse("2026-10-11"), LocalDate.parse("2026-10-12")), dailyWeathers.keys)
    }

    @Test
    fun `保存された天気がマスタになければ例外（データの誤り）`() {
        dailyWeathers[LocalDate.parse("2026-10-11")] = DailyWeather(LocalDate.parse("2026-10-11"), WeatherId("nope"))

        assertFailsWith<IllegalStateException> { service("2026-10-11T00:00:00Z").getTodayWeather() }
    }

    private fun weather(
        id: String,
        weight: Int,
    ): Weather = Weather(WeatherId(id), id, Attribute.YANG, weight, CharacterStatus(0, 0, 0))
}
