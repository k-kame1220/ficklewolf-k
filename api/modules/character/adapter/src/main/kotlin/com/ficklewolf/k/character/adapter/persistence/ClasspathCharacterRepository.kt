package com.ficklewolf.k.character.adapter.persistence

import com.ficklewolf.k.character.application.CharacterRepository
import com.ficklewolf.k.character.domain.Character
import com.ficklewolf.k.character.domain.CharacterAssets
import com.ficklewolf.k.shared.kernel.Attribute
import com.ficklewolf.k.shared.kernel.CharacterId
import org.springframework.core.io.ClassPathResource
import tools.jackson.databind.JsonNode
import tools.jackson.databind.json.JsonMapper

class ClasspathCharacterRepository(
    jsonMapper: JsonMapper,
) : CharacterRepository {
    private val masters: Map<CharacterId, Character> =
        jsonMapper
            .readTree(ClassPathResource(MASTER_PATH).contentAsByteArray)
            .asArray()
            .values()
            .map { it.toCharacter() }
            .associateBy { it.id }

    override fun findById(id: CharacterId): Character? = masters[id]

    override fun listAll(): List<Character> = masters.values.toList()

    override fun listByIds(ids: Collection<CharacterId>): List<Character> = ids.mapNotNull { masters[it] }

    private companion object {
        const val MASTER_PATH = "character/characters.json"
    }
}

private fun JsonNode.toCharacter(): Character {
    val rawAttribute = required("attribute").stringValue()
    val assets = required("assets")
    return Character(
        no = required("no").intValue(),
        id = CharacterId(required("id").stringValue()),
        name = required("name").stringValue(),
        attribute = Attribute.of(rawAttribute) ?: error("Unknown attribute $rawAttribute"),
        description = required("description").stringValue(),
        assets =
            CharacterAssets(
                main = assets.required("main").stringValue(),
                icon = assets.required("icon").stringValue(),
                home = assets.required("home").stringValue(),
            ),
    )
}
