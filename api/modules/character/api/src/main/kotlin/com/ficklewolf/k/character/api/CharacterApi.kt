package com.ficklewolf.k.character.api

import com.ficklewolf.k.shared.kernel.CharacterId
import com.ficklewolf.k.shared.kernel.PlayerId

interface CharacterApi {
    fun owns(
        playerId: PlayerId,
        characterId: CharacterId,
    ): Boolean

    fun acquire(
        playerId: PlayerId,
        characterId: CharacterId,
    ): AcquireCharacterResult

    fun getStarterId(): CharacterId
}
