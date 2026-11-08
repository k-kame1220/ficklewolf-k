package com.ficklewolf.k.quest.adapter.persistence

import com.ficklewolf.k.quest.application.QuestRepository
import com.ficklewolf.k.quest.domain.Quest
import com.ficklewolf.k.quest.domain.QuestKind
import com.ficklewolf.k.quest.domain.QuestStage
import com.ficklewolf.k.shared.kernel.Attribute
import com.ficklewolf.k.shared.kernel.EnemyAction
import com.ficklewolf.k.shared.kernel.QuestId
import com.ficklewolf.k.shared.kernel.WeatherId
import org.springframework.core.io.ClassPathResource
import tools.jackson.databind.JsonNode
import tools.jackson.databind.json.JsonMapper

class ClasspathQuestRepository(
    jsonMapper: JsonMapper,
) : QuestRepository {
    private val masters: Map<QuestId, Quest> =
        jsonMapper
            .readTree(ClassPathResource(MASTER_PATH).contentAsByteArray)
            .asArray()
            .values()
            .map { it.toQuest() }
            .associateBy { it.id }

    override fun listAll(): List<Quest> = masters.values.toList()

    private companion object {
        const val MASTER_PATH = "quest/quests.json"
    }
}

private fun JsonNode.toQuest(): Quest {
    val kind =
        when (val rawKind = required("kind").stringValue()) {
            "main" -> QuestKind.Main
            "event" -> QuestKind.Event
            "weather" -> QuestKind.Weather(WeatherId(required("weatherId").stringValue()))
            else -> error("Unknown quest kind $rawKind")
        }
    val stages =
        required("stages").asArray().values().map { stage ->
            val battle = stage.required("battle")
            val rawAttribute = battle.required("attribute").stringValue()
            QuestStage(
                imageKey = stage.required("imageKey").stringValue(),
                attribute = Attribute.of(rawAttribute) ?: error("Unknown attribute $rawAttribute"),
                turns =
                    battle.required("turns").asArray().values().map { turn ->
                        val rawAction = turn.stringValue()
                        EnemyAction.of(rawAction) ?: error("Unknown enemy action $rawAction")
                    },
                revealCount = stage.required("revealCount").intValue(),
            )
        }
    return Quest(
        id = QuestId(required("id").stringValue()),
        kind = kind,
        name = required("name").stringValue(),
        order = required("order").intValue(),
        stages = stages,
    )
}
