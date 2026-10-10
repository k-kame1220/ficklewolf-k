package com.ficklewolf.k.app.domain

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class AppTest {
    @Test
    fun `x_y_z の形なら作れる`() {
        assertEquals("0.1.0", App("0.1.0").minAppVersion)
    }

    @Test
    fun `x_y_z の形でなければ作れない`() {
        assertFailsWith<IllegalArgumentException> { App("0.1") }
        assertFailsWith<IllegalArgumentException> { App("latest") }
    }
}
