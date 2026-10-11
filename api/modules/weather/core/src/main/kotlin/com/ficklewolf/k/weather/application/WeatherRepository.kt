package com.ficklewolf.k.weather.application

import com.ficklewolf.k.shared.kernel.WeatherId
import com.ficklewolf.k.weather.domain.Weather

interface WeatherRepository {
    fun findById(id: WeatherId): Weather?

    fun listAll(): List<Weather>
}
