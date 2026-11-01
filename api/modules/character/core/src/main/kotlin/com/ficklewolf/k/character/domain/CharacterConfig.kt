package com.ficklewolf.k.character.domain

import com.ficklewolf.k.shared.kernel.CharacterId
import com.ficklewolf.k.shared.kernel.Stats

data class CharacterConfig(
    val starterCharacterId: CharacterId,
    val itemUseMax: Stats,
    val itemBonusPerUse: Stats,
    val duplicateBonusPerCount: Stats,
)
