package com.ficklewolf.k.item.domain

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull
import kotlin.test.assertTrue

class ItemCountTest {
    @Test
    fun `0 以上なら作れて、マイナスは null`() {
        assertEquals(0, ItemCount.of(0)?.value)
        assertNull(ItemCount.of(-1))
    }

    @Test
    fun `引き算で足りなければ null`() {
        assertEquals(ItemCount.of(1), count(3) - count(2))
        assertNull(count(1) - count(2))
    }

    @Test
    fun `大小を比べられる`() {
        assertTrue(count(1) > ItemCount.ZERO)
    }

    private fun count(value: Int): ItemCount = ItemCount.of(value) ?: error("個数が使えない")
}
