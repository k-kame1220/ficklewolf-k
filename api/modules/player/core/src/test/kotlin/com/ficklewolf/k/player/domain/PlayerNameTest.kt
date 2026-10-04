package com.ficklewolf.k.player.domain

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull

class PlayerNameTest {
    @Test
    fun `前後の空白を除いた名前になる`() {
        assertEquals("ゲスト", PlayerName.of("  ゲスト  ")?.value)
    }

    @Test
    fun `絵文字はコードポイントで数えるので 6 個まで使える`() {
        assertEquals("🐺🐺🐺🐺🐺🐺", PlayerName.of("🐺🐺🐺🐺🐺🐺")?.value)
    }

    @Test
    fun `空・7 文字・制御文字は使えない`() {
        assertNull(PlayerName.of("   "))
        assertNull(PlayerName.of("abcdefg"))
        assertNull(PlayerName.of("a\nb"))
    }
}
