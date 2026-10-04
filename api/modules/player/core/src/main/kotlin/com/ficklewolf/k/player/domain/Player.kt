package com.ficklewolf.k.player.domain

import com.ficklewolf.k.shared.kernel.PlayerId

data class Player(
    val id: PlayerId,
    val name: PlayerName,
    val level: Int,
    val fuda: Int,
    val selectedCharacterId: String,
)
