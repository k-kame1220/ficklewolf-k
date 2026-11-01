package com.ficklewolf.k.character.domain

import com.ficklewolf.k.shared.kernel.Stats

data class CharacterStats(
    val base: Stats,
    val item: Stats,
    val duplicate: Stats,
    val weather: Stats,
) {
    val total: Stats get() = base + item + duplicate + weather

    companion object {
        fun of(
            character: Character,
            investment: CharacterInvestment,
            itemBonusPerUse: Stats,
            duplicateBonusPerCount: Stats,
            weatherBonus: Stats,
        ): CharacterStats =
            CharacterStats(
                base = character.baseStats,
                item = investment.itemUses * itemBonusPerUse,
                duplicate = investment.duplicates * duplicateBonusPerCount,
                weather = weatherBonus,
            )
    }
}
