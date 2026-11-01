package com.ficklewolf.k.character.domain

import com.ficklewolf.k.shared.kernel.CharacterId
import com.ficklewolf.k.shared.kernel.PlayerId
import com.ficklewolf.k.shared.kernel.Stat
import com.ficklewolf.k.shared.kernel.Stats

data class CharacterInventory(
    val playerId: PlayerId,
    val investments: Map<CharacterId, CharacterInvestment>,
) {
    operator fun get(characterId: CharacterId): CharacterInvestment =
        investments[characterId] ?: CharacterInvestment.ZERO

    fun owns(characterId: CharacterId): Boolean = characterId in investments

    fun acquire(characterId: CharacterId): CharacterInventory =
        if (owns(characterId)) {
            this
        } else {
            copy(investments = investments + (characterId to CharacterInvestment.ZERO))
        }

    fun enhance(
        characterId: CharacterId,
        items: Stats,
        itemUseMax: Stats,
    ): CharacterInventory? {
        val current = this[characterId]
        val itemUses = current.itemUses + items
        if (Stat.entries.any { itemUses[it] > itemUseMax[it] }) return null
        return copy(investments = investments + (characterId to current.copy(itemUses = itemUses)))
    }

    companion object {
        fun empty(playerId: PlayerId): CharacterInventory = CharacterInventory(playerId, emptyMap())
    }
}
