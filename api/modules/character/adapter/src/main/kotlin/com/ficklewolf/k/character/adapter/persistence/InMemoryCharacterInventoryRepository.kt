package com.ficklewolf.k.character.adapter.persistence

import com.ficklewolf.k.character.application.CharacterInventoryRepository
import com.ficklewolf.k.character.domain.CharacterInventory
import com.ficklewolf.k.shared.kernel.PlayerId
import java.util.concurrent.ConcurrentHashMap

class InMemoryCharacterInventoryRepository : CharacterInventoryRepository {
    private val characterInventory = ConcurrentHashMap<PlayerId, CharacterInventory>()

    override fun findByPlayerId(playerId: PlayerId): CharacterInventory? = characterInventory[playerId]

    override fun save(inventory: CharacterInventory) {
        characterInventory[inventory.playerId] = inventory
    }
}
