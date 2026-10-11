package com.ficklewolf.k.character.adapter.persistence

import tools.jackson.databind.json.JsonMapper
import kotlin.test.Test
import kotlin.test.assertNotNull

class ClasspathCharacterConfigRepositoryTest {
    private val jsonMapper = JsonMapper.builder().build()

    @Test
    fun `同梱した settings_json の最初のキャラは、characters_json にいる`() {
        val config = ClasspathCharacterConfigRepository(jsonMapper).load()

        assertNotNull(ClasspathCharacterRepository(jsonMapper).findById(config.starterCharacterId))
    }
}
