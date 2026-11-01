package com.ficklewolf.k.weather.api

import com.ficklewolf.k.shared.kernel.Attribute
import com.ficklewolf.k.shared.kernel.Stats

data class TodayWeatherSummary(
    val attribute: Attribute,
    val bonus: Stats,
) {
    fun bonusFor(attribute: Attribute): Stats = if (attribute == this.attribute) bonus else Stats.ZERO
}
