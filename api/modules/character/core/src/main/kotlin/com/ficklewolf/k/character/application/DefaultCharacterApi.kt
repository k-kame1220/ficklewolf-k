package com.ficklewolf.k.character.application

import com.ficklewolf.k.character.api.AcquireCharacterResult
import com.ficklewolf.k.character.api.CharacterApi
import com.ficklewolf.k.character.api.CharacterSummary
import com.ficklewolf.k.character.domain.Character
import com.ficklewolf.k.shared.kernel.CharacterId
import com.ficklewolf.k.shared.kernel.PlayerId

fun characterApi(characterService: CharacterService): CharacterApi = DefaultCharacterApi(characterService)

internal class DefaultCharacterApi(
    private val characterService: CharacterService,
) : CharacterApi {
    override fun owns(
        playerId: PlayerId,
        characterId: CharacterId,
    ): Boolean = characterService.ownsCharacter(playerId, characterId)

    override fun acquire(
        playerId: PlayerId,
        characterId: CharacterId,
    ): AcquireCharacterResult {
        val result =
            characterService.acquireCharacter(playerId, characterId) ?: return AcquireCharacterResult.CharacterNotFound

        return AcquireCharacterResult.Acquired(result.toSummary())
    }

    override fun getStarterId(): CharacterId = characterService.getStarterCharacter().id
}

private fun Character.toSummary(): CharacterSummary =
    CharacterSummary(id, name, attribute, description, CharacterSummary.Assets(assets.main, assets.icon, assets.home))
