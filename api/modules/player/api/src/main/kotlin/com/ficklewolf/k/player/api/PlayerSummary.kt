package com.ficklewolf.k.player.api

import com.ficklewolf.k.shared.kernel.PlayerId

data class PlayerSummary(
    val id: PlayerId,
    val name: String,
    val level: Int,
    val fuda: Int,
    val selectedCharacterId: String,
)
