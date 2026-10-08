package com.ficklewolf.k.player.api

sealed interface CreatePlayerResult {
    data class Created(
        val player: PlayerSummary,
    ) : CreatePlayerResult

    data object InvalidName : CreatePlayerResult
}
