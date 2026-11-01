package com.ficklewolf.k.item.domain

import com.ficklewolf.k.shared.kernel.ItemId
import com.ficklewolf.k.shared.kernel.PlayerId

data class ItemInventory(
    val playerId: PlayerId,
    val counts: Map<ItemId, ItemCount>,
) {
    operator fun get(itemId: ItemId): ItemCount = counts[itemId] ?: ItemCount.ZERO

    fun add(stacks: List<ItemStack>): ItemInventory {
        val next = counts.toMutableMap()
        for ((itemId, count) in stacks) {
            next[itemId] = (next[itemId] ?: ItemCount.ZERO) + count
        }
        return copy(counts = next)
    }

    fun remove(stacks: List<ItemStack>): ItemInventory? {
        val next = counts.toMutableMap()
        for ((itemId, count) in stacks) {
            next[itemId] = ((next[itemId] ?: ItemCount.ZERO) - count) ?: return null
        }
        return copy(counts = next)
    }

    companion object {
        fun empty(playerId: PlayerId): ItemInventory = ItemInventory(playerId, emptyMap())
    }
}
