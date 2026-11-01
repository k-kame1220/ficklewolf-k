package com.ficklewolf.k.character.application

import com.ficklewolf.k.character.domain.CharacterInventory
import com.ficklewolf.k.shared.kernel.PlayerId

interface CharacterInventoryRepository {
    fun findByPlayerId(playerId: PlayerId): CharacterInventory?

    fun save(inventory: CharacterInventory)
}
