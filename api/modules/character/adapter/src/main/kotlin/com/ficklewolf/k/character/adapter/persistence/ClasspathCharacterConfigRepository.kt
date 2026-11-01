package com.ficklewolf.k.character.adapter.persistence

import com.ficklewolf.k.character.application.CharacterConfigRepository
import com.ficklewolf.k.character.domain.CharacterConfig
import com.ficklewolf.k.shared.kernel.CharacterId
import com.ficklewolf.k.shared.kernel.Stats
import org.springframework.core.io.ClassPathResource
import tools.jackson.databind.JsonNode
import tools.jackson.databind.json.JsonMapper

class ClasspathCharacterConfigRepository(
    jsonMapper: JsonMapper,
) : CharacterConfigRepository {
    private val config: CharacterConfig =
        jsonMapper
            .readTree(
                ClassPathResource(MASTER_PATH).contentAsByteArray,
            ).toCharacterConfig()

    override fun load(): CharacterConfig = config

    private companion object {
        const val MASTER_PATH = "character/settings.json"
    }
}

private fun JsonNode.toCharacterConfig(): CharacterConfig {
    val itemUseMax = required("growth").required("itemUseMax")
    val itemBonusPerUse = required("growth").required("itemBonusPerUse")
    val duplicateBonusPerCount = required("growth").required("duplicateBonusPerCount")
    return CharacterConfig(
        starterCharacterId = CharacterId(required("starterCharacterId").stringValue()),
        itemUseMax =
            Stats(
                hp = itemUseMax.required("hp").intValue(),
                attack = itemUseMax.required("attack").intValue(),
                defence = itemUseMax.required("defence").intValue(),
            ),
        itemBonusPerUse =
            Stats(
                hp = itemBonusPerUse.required("hp").intValue(),
                attack = itemBonusPerUse.required("attack").intValue(),
                defence = itemBonusPerUse.required("defence").intValue(),
            ),
        duplicateBonusPerCount =
            Stats(
                hp = duplicateBonusPerCount.required("hp").intValue(),
                attack = duplicateBonusPerCount.required("attack").intValue(),
                defence = duplicateBonusPerCount.required("defence").intValue(),
            ),
    )
}
