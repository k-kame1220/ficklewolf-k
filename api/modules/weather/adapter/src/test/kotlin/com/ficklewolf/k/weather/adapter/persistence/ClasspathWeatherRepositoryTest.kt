package com.ficklewolf.k.weather.adapter.persistence

import com.ficklewolf.k.shared.kernel.Attribute
import com.ficklewolf.k.shared.kernel.CharacterStatus
import com.ficklewolf.k.shared.kernel.WeatherId
import tools.jackson.databind.json.JsonMapper
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull
import kotlin.test.assertTrue

class ClasspathWeatherRepositoryTest {
    private val repository = ClasspathWeatherRepository(JsonMapper.builder().build())

    @Test
    fun `同梱した weathers_json から天気を読む`() {
        val rain = repository.findById(WeatherId("rain")) ?: error("雨がない")

        assertEquals("雨", rain.name)
        assertEquals(Attribute.NOTE, rain.attribute)
        assertEquals(2, rain.weight)
        assertEquals(CharacterStatus(hp = 0, attack = 60, defence = 0), rain.bonus)
    }

    @Test
    fun `どの天気も重みが 1 以上（抽選できる）`() {
        val all = repository.listAll()

        assertTrue(all.isNotEmpty())
        assertTrue(all.all { it.weight > 0 })
    }

    @Test
    fun `listAll は weathers_json の並びのまま返す（抽選の結果が並びに依存するため）`() {
        val ids = repository.listAll().map { it.id.value }

        assertEquals("blue-sky", ids.first())
        assertEquals(ids.size, ids.toSet().size)
    }

    @Test
    fun `マスタにない ID は null`() {
        assertNull(repository.findById(WeatherId("nope")))
    }
}
