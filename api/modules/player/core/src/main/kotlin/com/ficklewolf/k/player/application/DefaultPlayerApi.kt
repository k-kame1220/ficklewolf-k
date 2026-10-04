package com.ficklewolf.k.player.application

import com.ficklewolf.k.player.api.CreatePlayerResult
import com.ficklewolf.k.player.api.PlayerApi
import com.ficklewolf.k.player.api.PlayerSummary
import com.ficklewolf.k.player.domain.Player
import com.ficklewolf.k.player.domain.PlayerName
import com.ficklewolf.k.shared.kernel.PlayerId

fun playerApi(playerService: PlayerService): PlayerApi = DefaultPlayerApi(playerService)

internal class DefaultPlayerApi(
    private val playerService: PlayerService,
) : PlayerApi {
    override fun createPlayer(name: String): CreatePlayerResult {
        val playerName = PlayerName.of(name) ?: return CreatePlayerResult.InvalidName
        return CreatePlayerResult.Created(playerService.createPlayer(playerName).toSummary())
    }

    override fun find(id: PlayerId): PlayerSummary? = playerService.find(id)?.toSummary()
}

private fun Player.toSummary(): PlayerSummary = PlayerSummary(id, name.value, level, fuda, selectedCharacterId)
