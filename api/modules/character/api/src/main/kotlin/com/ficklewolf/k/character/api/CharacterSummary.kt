package com.ficklewolf.k.character.api

import com.ficklewolf.k.shared.kernel.Attribute
import com.ficklewolf.k.shared.kernel.CharacterId

data class CharacterSummary(
    val id: CharacterId,
    val name: String,
    val attribute: Attribute,
    val description: String,
    val assets: Assets,
) {
    data class Assets(
        val main: String,
        val icon: String,
        val home: String,
    )
}
