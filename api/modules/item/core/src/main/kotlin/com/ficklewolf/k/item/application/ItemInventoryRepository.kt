package com.ficklewolf.k.item.application

import com.ficklewolf.k.item.domain.ItemInventory
import com.ficklewolf.k.shared.kernel.PlayerId

interface ItemInventoryRepository {
    fun findByPlayerId(playerId: PlayerId): ItemInventory?

    fun save(inventory: ItemInventory)
}
