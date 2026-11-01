package com.ficklewolf.k.item.adapter.persistence

import com.ficklewolf.k.item.application.ItemInventoryRepository
import com.ficklewolf.k.item.domain.ItemInventory
import com.ficklewolf.k.shared.kernel.PlayerId
import java.util.concurrent.ConcurrentHashMap

class InMemoryItemInventoryRepository : ItemInventoryRepository {
    private val itemInventory = ConcurrentHashMap<PlayerId, ItemInventory>()

    override fun findByPlayerId(playerId: PlayerId): ItemInventory? = itemInventory[playerId]

    override fun save(inventory: ItemInventory) {
        itemInventory[inventory.playerId] = inventory
    }
}
