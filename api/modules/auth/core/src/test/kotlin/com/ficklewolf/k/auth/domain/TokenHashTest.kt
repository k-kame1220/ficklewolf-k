package com.ficklewolf.k.auth.domain

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotEquals

class TokenHashTest {
    @Test
    fun `同じトークンからは同じハッシュになる`() {
        assertEquals(TokenHash.of("token-1"), TokenHash.of("token-1"))
    }

    @Test
    fun `違うトークンからは違うハッシュになる`() {
        assertNotEquals(TokenHash.of("token-1"), TokenHash.of("token-2"))
    }

    @Test
    fun `ハッシュは 64 文字の 16 進数`() {
        assertEquals(64, TokenHash.of("token-1").value.length)
    }
}
