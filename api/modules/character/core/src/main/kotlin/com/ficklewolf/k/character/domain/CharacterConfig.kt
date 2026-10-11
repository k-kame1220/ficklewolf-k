package com.ficklewolf.k.character.domain

import com.ficklewolf.k.shared.kernel.CharacterId
import com.ficklewolf.k.shared.kernel.CharacterStatus

data class CharacterConfig(
    val starterCharacterId: CharacterId,
    val duplicateBonusPerCount: CharacterStatus,
)
