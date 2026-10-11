package com.ficklewolf.k.character.domain

import com.ficklewolf.k.shared.kernel.CharacterId
import com.ficklewolf.k.shared.kernel.PlayerId

data class OwnedCharacter(
    val playerId: PlayerId,
    val characterId: CharacterId,
)
