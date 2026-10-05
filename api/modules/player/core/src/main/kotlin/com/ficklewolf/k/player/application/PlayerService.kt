package com.ficklewolf.k.player.application

import com.ficklewolf.k.player.domain.Player
import com.ficklewolf.k.player.domain.PlayerName
import com.ficklewolf.k.shared.kernel.PlayerId
import com.ficklewolf.k.shared.kernel.TransactionRunner
import java.util.UUID

interface PlayerService {
    fun createPlayer(name: PlayerName): Player

    fun find(id: PlayerId): Player?

    fun rename(
        id: PlayerId,
        name: PlayerName,
    ): Player?
}

fun playerService(
    repository: PlayerRepository,
    transaction: TransactionRunner,
): PlayerService = DefaultPlayerService(repository, transaction)

internal class DefaultPlayerService(
    private val repository: PlayerRepository,
    private val transaction: TransactionRunner,
) : PlayerService {
    override fun createPlayer(name: PlayerName): Player =
        transaction.run {
            val player = Player.createGuest(PlayerId(UUID.randomUUID()), name)
            repository.save(player)
            player
        }

    override fun find(id: PlayerId): Player? = repository.findById(id)

    override fun rename(
        id: PlayerId,
        name: PlayerName,
    ): Player? =
        transaction.run {
            repository.findById(id)?.rename(name)?.also { repository.save(it) }
        }
}
