package com.ficklewolf.k.weather.domain

import com.ficklewolf.k.shared.kernel.Attribute
import com.ficklewolf.k.shared.kernel.CharacterStatus
import com.ficklewolf.k.shared.kernel.WeatherId

data class Weather(
    val id: WeatherId,
    val name: String,
    val attribute: Attribute,
    val weight: Int,
    val bonus: CharacterStatus,
)
