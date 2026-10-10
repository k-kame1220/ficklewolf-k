package com.ficklewolf.k.app.adapter.persistence

import tools.jackson.databind.json.JsonMapper
import kotlin.test.Test
import kotlin.test.assertTrue

class ClasspathAppRepositoryTest {
    @Test
    fun `同梱した settings_json から最低バージョンを読む`() {
        val app = ClasspathAppRepository(JsonMapper.builder().build()).load()

        assertTrue(app.minAppVersion.matches(Regex("""^\d+\.\d+\.\d+$""")))
    }
}
