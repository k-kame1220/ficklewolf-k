package com.ficklewolf.k.quest.adapter.persistence

import com.ficklewolf.k.quest.application.QuestConfigRepository
import com.ficklewolf.k.quest.domain.QuestConfig
import org.springframework.core.io.ClassPathResource
import tools.jackson.databind.JsonNode
import tools.jackson.databind.json.JsonMapper

class ClasspathQuestConfigRepository(
    jsonMapper: JsonMapper,
) : QuestConfigRepository {
    private val config: QuestConfig =
        jsonMapper
            .readTree(
                ClassPathResource(
                    MASTER_PATH,
                ).contentAsByteArray,
            ).toQuestConfig()

    override fun load(): QuestConfig = config

    private companion object {
        const val MASTER_PATH = "quest/settings.json"
    }
}

private fun JsonNode.toQuestConfig(): QuestConfig {
    val rewards = required("rewards")
    return QuestConfig(
        firstClearRecruitRate = rewards.required("firstClearRecruitRate").doubleValue(),
        repeatRecruitRate = rewards.required("repeatRecruitRate").doubleValue(),
        weatherItemDropMin = rewards.required("weatherItemDropMin").intValue(),
        weatherItemDropMax = rewards.required("weatherItemDropMax").intValue(),
        fudaPerEvenLevel = rewards.required("fudaPerEvenLevel").intValue(),
    )
}
