package com.ficklewolf.k.character.application

import com.ficklewolf.k.character.domain.OwnedCharacter
import com.ficklewolf.k.shared.kernel.CharacterId
import com.ficklewolf.k.shared.kernel.PlayerId

interface OwnedCharacterRepository {
    fun listByPlayerId(playerId: PlayerId): List<OwnedCharacter>

    fun findByPlayerIdAndCharacterId(
        playerId: PlayerId,
        characterId: CharacterId,
    ): OwnedCharacter?

    fun save(ownedCharacter: OwnedCharacter)
}
