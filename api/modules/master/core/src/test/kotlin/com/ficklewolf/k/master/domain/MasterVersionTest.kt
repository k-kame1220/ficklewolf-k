package com.ficklewolf.k.master.domain

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotEquals

class MasterVersionTest {
    private val attributes = MasterFile("attributes", "[1]".toByteArray())
    private val settings = MasterFile("settings", """{"a":"あ"}""".toByteArray())

    @Test
    fun `spec の validate_py と同じ計算でバージョンを出す`() {
        assertEquals("96a1d63689c44809", MasterVersion.of(listOf(attributes, settings)).value)
    }

    @Test
    fun `ファイルの順番が変わるとバージョンも変わる`() {
        assertNotEquals(
            MasterVersion.of(listOf(attributes, settings)),
            MasterVersion.of(listOf(settings, attributes)),
        )
    }
}
