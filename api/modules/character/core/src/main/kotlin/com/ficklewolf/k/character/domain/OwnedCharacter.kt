package com.ficklewolf.k.character.domain

import com.ficklewolf.k.shared.kernel.Attribute
import com.ficklewolf.k.shared.kernel.CharacterId
import com.ficklewolf.k.shared.kernel.Stats

data class OwnedCharacter(
    val id: CharacterId,
    val name: String,
    val attribute: Attribute,
    val description: String,
    val assets: CharacterAssets,
    val stats: CharacterStats,
    val itemUses: Stats,
    val itemUseMax: Stats,
) {
    companion object {
        fun of(
            character: Character,
            investment: CharacterInvestment,
            config: CharacterConfig,
            weatherBonus: Stats,
        ): OwnedCharacter =
            OwnedCharacter(
                id = character.id,
                name = character.name,
                attribute = character.attribute,
                description = character.description,
                assets = character.assets,
                stats =
                    CharacterStats.of(
                        character = character,
                        investment = investment,
                        itemBonusPerUse = config.itemBonusPerUse,
                        duplicateBonusPerCount = config.duplicateBonusPerCount,
                        weatherBonus = weatherBonus,
                    ),
                itemUses = investment.itemUses,
                itemUseMax = config.itemUseMax,
            )
    }
}
