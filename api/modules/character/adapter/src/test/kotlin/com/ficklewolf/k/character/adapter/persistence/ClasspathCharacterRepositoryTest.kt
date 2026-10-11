package com.ficklewolf.k.character.adapter.persistence

import com.ficklewolf.k.character.domain.CharacterAssets
import com.ficklewolf.k.shared.kernel.Attribute
import com.ficklewolf.k.shared.kernel.CharacterId
import tools.jackson.databind.json.JsonMapper
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull
import kotlin.test.assertTrue

class ClasspathCharacterRepositoryTest {
    private val repository = ClasspathCharacterRepository(JsonMapper.builder().build())

    @Test
    fun `同梱した characters_json からキャラを読む`() {
        val zero = repository.findById(CharacterId("zero")) ?: error("ZERO がない")

        assertEquals(1, zero.no)
        assertEquals("ZERO", zero.name)
        assertEquals(Attribute.MOON, zero.attribute)
        assertEquals(
            CharacterAssets("characters/zero/main", "characters/zero/icon", "characters/zero/home"),
            zero.assets,
        )
    }

    @Test
    fun `図鑑の番号はキャラごとに違う`() {
        val all = repository.listAll()

        assertTrue(all.isNotEmpty())
        assertEquals(all.size, all.map { it.no }.toSet().size)
    }

    @Test
    fun `listByIds はマスタにある ID のキャラだけを返す`() {
        val characters = repository.listByIds(listOf(CharacterId("a"), CharacterId("nope"), CharacterId("zero")))

        assertEquals(listOf(CharacterId("a"), CharacterId("zero")), characters.map { it.id })
    }

    @Test
    fun `マスタにない ID は null`() {
        assertNull(repository.findById(CharacterId("nope")))
    }
}
