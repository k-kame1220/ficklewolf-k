package com.ficklewolf.k.weather.domain

import com.ficklewolf.k.shared.kernel.WeatherId
import java.time.LocalDate

data class DailyWeather(
    val date: LocalDate,
    val weatherId: WeatherId,
)
