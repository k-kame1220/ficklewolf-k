package com.ficklewolf.k.player.domain

import com.ficklewolf.k.shared.kernel.PlayerId

data class Player(
    val id: PlayerId,
    val name: PlayerName,
    val level: Int,
    val fuda: Int,
    val selectedCharacterId: String,
) {
    companion object {
        const val FIRST_LEVEL = 1
        const val STARTER_CHARACTER_ID = "zero"

        fun createGuest(
            id: PlayerId,
            name: PlayerName,
        ): Player = Player(id, name, FIRST_LEVEL, 0, STARTER_CHARACTER_ID)
    }

    fun rename(newName: PlayerName): Player = copy(name = newName)
}
