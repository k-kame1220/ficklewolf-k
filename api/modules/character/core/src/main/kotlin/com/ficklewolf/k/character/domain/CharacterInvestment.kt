package com.ficklewolf.k.character.domain

import com.ficklewolf.k.shared.kernel.Stats

data class CharacterInvestment(
    val duplicates: Stats,
    val itemUses: Stats,
) {
    companion object {
        val ZERO = CharacterInvestment(Stats.ZERO, Stats.ZERO)
    }
}
