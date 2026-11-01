package com.ficklewolf.k.item.domain

import com.ficklewolf.k.shared.kernel.ItemId
import com.ficklewolf.k.shared.kernel.PlayerId
import java.util.UUID
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull

class ItemInventoryTest {
    private val hp = ItemId("moon-hp")
    private val attack = ItemId("moon-attack")
    private val empty = ItemInventory.empty(PlayerId(UUID.randomUUID()))

    @Test
    fun `持っていないアイテムは 0 個`() {
        assertEquals(ItemCount.ZERO, empty[hp])
    }

    @Test
    fun `同じアイテムが 2 回来たら足し合わせる`() {
        val inventory = empty.add(listOf(ItemStack(hp, count(3)), ItemStack(hp, count(2))))

        assertEquals(count(5), inventory[hp])
    }

    @Test
    fun `足りていれば、指定した数だけ減らす`() {
        val inventory = empty.add(listOf(ItemStack(hp, count(3)), ItemStack(attack, count(1))))

        val removed = inventory.remove(listOf(ItemStack(hp, count(2)), ItemStack(attack, count(1))))

        assertEquals(count(1), removed?.get(hp))
        assertEquals(ItemCount.ZERO, removed?.get(attack))
    }

    @Test
    fun `1 つでも足りなければ null（何も減らさない）`() {
        val inventory = empty.add(listOf(ItemStack(hp, count(3))))

        assertNull(inventory.remove(listOf(ItemStack(hp, count(1)), ItemStack(attack, count(1)))))
        assertEquals(count(3), inventory[hp])
    }

    private fun count(value: Int): ItemCount = ItemCount.of(value) ?: error("個数が使えない")
}
