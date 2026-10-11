package com.ficklewolf.k.weather.adapter.persistence

import com.ficklewolf.k.shared.kernel.Attribute
import com.ficklewolf.k.shared.kernel.CharacterStatus
import com.ficklewolf.k.shared.kernel.WeatherId
import com.ficklewolf.k.weather.application.WeatherRepository
import com.ficklewolf.k.weather.domain.Weather
import org.springframework.core.io.ClassPathResource
import tools.jackson.databind.JsonNode
import tools.jackson.databind.json.JsonMapper

class ClasspathWeatherRepository(
    jsonMapper: JsonMapper,
) : WeatherRepository {
    private val masters: Map<WeatherId, Weather> =
        jsonMapper
            .readTree(ClassPathResource(MASTER_PATH).contentAsByteArray)
            .asArray()
            .values()
            .map { it.toWeather() }
            .associateBy { it.id }

    override fun findById(id: WeatherId): Weather? = masters[id]

    override fun listAll(): List<Weather> = masters.values.toList()

    private companion object {
        const val MASTER_PATH = "weather/weathers.json"
    }
}

private fun JsonNode.toWeather(): Weather {
    val rawAttribute = required("attribute").stringValue()
    val bonus = required("bonus")
    return Weather(
        id = WeatherId(required("id").stringValue()),
        name = required("name").stringValue(),
        attribute = Attribute.of(rawAttribute) ?: error("Unknown attribute $rawAttribute"),
        weight = required("weight").intValue(),
        bonus =
            CharacterStatus(
                bonus.required("hp").intValue(),
                bonus.required("attack").intValue(),
                bonus.required("defence").intValue(),
            ),
    )
}
