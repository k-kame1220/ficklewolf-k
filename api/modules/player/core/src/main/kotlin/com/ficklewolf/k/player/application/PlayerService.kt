package com.ficklewolf.k.player.application

import com.ficklewolf.k.character.api.CharacterApi
import com.ficklewolf.k.player.domain.Player
import com.ficklewolf.k.player.domain.PlayerName
import com.ficklewolf.k.shared.kernel.CharacterId
import com.ficklewolf.k.shared.kernel.PlayerId
import com.ficklewolf.k.shared.kernel.TransactionRunner
import java.util.UUID

sealed interface UpdatePlayerResult {
    data class Updated(
        val player: Player,
    ) : UpdatePlayerResult

    data object PlayerNotFound : UpdatePlayerResult

    data object CharacterNotOwned : UpdatePlayerResult
}

interface PlayerService {
    fun createPlayer(name: PlayerName): Player

    fun findPlayer(id: PlayerId): Player?

    fun updatePlayer(
        id: PlayerId,
        name: PlayerName?,
        selectedCharacterId: CharacterId?,
    ): UpdatePlayerResult
}

fun playerService(
    characterApi: CharacterApi,
    repository: PlayerRepository,
    transaction: TransactionRunner,
): PlayerService = DefaultPlayerService(characterApi, repository, transaction)

internal class DefaultPlayerService(
    private val characterApi: CharacterApi,
    private val repository: PlayerRepository,
    private val transaction: TransactionRunner,
) : PlayerService {
    override fun createPlayer(name: PlayerName): Player =
        transaction.run {
            val starterCharacterId = characterApi.getStarterId()
            val player = Player.createGuest(PlayerId(UUID.randomUUID()), name, starterCharacterId)
            repository.save(player)
            player
        }

    override fun findPlayer(id: PlayerId): Player? = repository.findById(id)

    override fun updatePlayer(
        id: PlayerId,
        name: PlayerName?,
        selectedCharacterId: CharacterId?,
    ): UpdatePlayerResult =
        transaction.run {
            val player = repository.findById(id) ?: return@run UpdatePlayerResult.PlayerNotFound
            if (selectedCharacterId != null && !characterApi.owns(id, selectedCharacterId)) {
                return@run UpdatePlayerResult.CharacterNotOwned
            }
            val updated =
                player
                    .let { if (name != null) it.rename(name) else it }
                    .let { if (selectedCharacterId != null) it.selectCharacter(selectedCharacterId) else it }
            repository.save(updated)
            UpdatePlayerResult.Updated(updated)
        }
}
