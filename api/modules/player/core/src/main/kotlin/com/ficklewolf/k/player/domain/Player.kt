package com.ficklewolf.k.player.domain

import com.ficklewolf.k.shared.kernel.CharacterId
import com.ficklewolf.k.shared.kernel.PlayerId

data class Player(
    val id: PlayerId,
    val name: PlayerName,
    val level: Int,
    val fuda: Int,
    val selectedCharacterId: CharacterId,
) {
    companion object {
        const val FIRST_LEVEL = 1

        fun createGuest(
            id: PlayerId,
            name: PlayerName,
            selectedCharacterId: CharacterId,
        ): Player = Player(id, name, FIRST_LEVEL, 0, selectedCharacterId)
    }

    fun rename(newName: PlayerName): Player = copy(name = newName)

    fun selectCharacter(newCharacterId: CharacterId): Player = copy(selectedCharacterId = newCharacterId)
}
