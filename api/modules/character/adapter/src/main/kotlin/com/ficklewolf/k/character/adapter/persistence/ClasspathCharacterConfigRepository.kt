package com.ficklewolf.k.character.adapter.persistence

import com.ficklewolf.k.character.application.CharacterConfigRepository
import com.ficklewolf.k.character.domain.CharacterConfig
import com.ficklewolf.k.shared.kernel.CharacterId
import com.ficklewolf.k.shared.kernel.CharacterStatus
import org.springframework.core.io.ClassPathResource
import tools.jackson.databind.JsonNode
import tools.jackson.databind.json.JsonMapper

class ClasspathCharacterConfigRepository(
    jsonMapper: JsonMapper,
) : CharacterConfigRepository {
    private val master: CharacterConfig =
        jsonMapper
            .readTree(
                ClassPathResource("character/settings.json").contentAsByteArray,
            ).toCharacterConfig()

    override fun load(): CharacterConfig = master
}

private fun JsonNode.toCharacterConfig(): CharacterConfig {
    val duplicateBonusPerCount = required("growth").required("duplicateBonusPerCount")
    return CharacterConfig(
        starterCharacterId = CharacterId(required("starterCharacterId").stringValue()),
        duplicateBonusPerCount =
            CharacterStatus(
                hp = duplicateBonusPerCount.required("hp").intValue(),
                attack = duplicateBonusPerCount.required("attack").intValue(),
                defence = duplicateBonusPerCount.required("defence").intValue(),
            ),
    )
}
