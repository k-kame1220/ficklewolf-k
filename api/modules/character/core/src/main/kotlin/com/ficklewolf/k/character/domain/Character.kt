package com.ficklewolf.k.character.domain

import com.ficklewolf.k.shared.kernel.Attribute
import com.ficklewolf.k.shared.kernel.CharacterId
import com.ficklewolf.k.shared.kernel.Stats

data class Character(
    val no: Int,
    val id: CharacterId,
    val name: String,
    val attribute: Attribute,
    val description: String,
    val assets: CharacterAssets,
    val baseStats: Stats,
    val duplicateBonusMax: Stats,
)
