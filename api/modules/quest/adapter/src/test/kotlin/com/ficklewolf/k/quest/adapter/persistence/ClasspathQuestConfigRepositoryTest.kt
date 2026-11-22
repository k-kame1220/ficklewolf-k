package com.ficklewolf.k.quest.adapter.persistence

import com.ficklewolf.k.quest.domain.QuestConfig
import tools.jackson.databind.json.JsonMapper
import kotlin.test.Test
import kotlin.test.assertEquals

class ClasspathQuestConfigRepositoryTest {
    @Test
    fun `同梱した settings_json から報酬の値を読む（整数で書かれた確率も小数として読める）`() {
        val config = ClasspathQuestConfigRepository(JsonMapper.builder().build()).load()

        assertEquals(
            QuestConfig(
                firstClearRecruitRate = 1.0,
                repeatRecruitRate = 0.2,
                weatherItemDropMin = 0,
                weatherItemDropMax = 3,
                fudaPerEvenLevel = 1,
            ),
            config,
        )
    }
}
