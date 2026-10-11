package com.ficklewolf.k.character.application

import com.ficklewolf.k.character.domain.Character
import com.ficklewolf.k.character.domain.OwnedCharacter
import com.ficklewolf.k.shared.kernel.CharacterId
import com.ficklewolf.k.shared.kernel.PlayerId
import com.ficklewolf.k.shared.kernel.TransactionRunner

interface CharacterService {
    fun findCharacter(id: CharacterId): Character?

    fun listOwnedCharacters(playerId: PlayerId): List<Character>

    fun ownsCharacter(
        playerId: PlayerId,
        characterId: CharacterId,
    ): Boolean

    fun acquireCharacter(
        playerId: PlayerId,
        characterId: CharacterId,
    ): Character?

    fun getStarterCharacter(): Character
}

fun characterService(
    characterRepository: CharacterRepository,
    ownedCharacterRepository: OwnedCharacterRepository,
    characterConfigRepository: CharacterConfigRepository,
    transaction: TransactionRunner,
): CharacterService =
    DefaultCharacterService(characterRepository, ownedCharacterRepository, characterConfigRepository, transaction)

internal class DefaultCharacterService(
    private val characterRepository: CharacterRepository,
    private val ownedCharacterRepository: OwnedCharacterRepository,
    private val characterConfigRepository: CharacterConfigRepository,
    private val transaction: TransactionRunner,
) : CharacterService {
    override fun findCharacter(id: CharacterId): Character? = characterRepository.findById(id)

    override fun listOwnedCharacters(playerId: PlayerId): List<Character> {
        val characterIds = ownedCharacterRepository.listByPlayerId(playerId).map { it.characterId }
        return characterRepository.listByIds(characterIds).sortedBy { it.no }
    }

    override fun ownsCharacter(
        playerId: PlayerId,
        characterId: CharacterId,
    ): Boolean = ownedCharacterRepository.findByPlayerIdAndCharacterId(playerId, characterId) != null

    override fun acquireCharacter(
        playerId: PlayerId,
        characterId: CharacterId,
    ): Character? =
        transaction.run {
            characterRepository.findById(characterId)?.also { character ->
                ownedCharacterRepository.save(OwnedCharacter(playerId, character.id))
            }
        }

    override fun getStarterCharacter(): Character =
        characterConfigRepository.load().starterCharacterId.let {
            characterRepository.findById(it) ?: error("starter character not found: ${it.value}")
        }
}
