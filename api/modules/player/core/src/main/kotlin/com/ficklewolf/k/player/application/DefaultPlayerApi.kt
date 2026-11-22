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
    override fun find(id: PlayerId): PlayerSummary? = playerService.findPlayer(id)?.toSummary()

    override fun create(name: String): CreatePlayerResult {
        val playerName = PlayerName.of(name) ?: return CreatePlayerResult.InvalidName
        return CreatePlayerResult.Created(playerService.createPlayer(playerName).toSummary())
    }

    override fun levelUp(id: PlayerId): PlayerSummary = playerService.levelUpPlayer(id).toSummary()

    override fun addFuda(
        id: PlayerId,
        amount: Int,
    ): PlayerSummary = playerService.addPlayerFuda(id, amount).toSummary()
}

private fun Player.toSummary(): PlayerSummary = PlayerSummary(id, name.value, level, fuda, selectedCharacterId)
