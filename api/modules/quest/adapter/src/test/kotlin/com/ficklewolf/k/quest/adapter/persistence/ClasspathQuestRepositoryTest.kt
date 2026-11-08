package com.ficklewolf.k.quest.adapter.persistence

import com.ficklewolf.k.quest.domain.QuestKind
import com.ficklewolf.k.shared.kernel.Attribute
import com.ficklewolf.k.shared.kernel.EnemyAction
import com.ficklewolf.k.shared.kernel.WeatherId
import tools.jackson.databind.json.JsonMapper
import kotlin.test.Test
import kotlin.test.assertEquals

class ClasspathQuestRepositoryTest {
    private val repository = ClasspathQuestRepository(JsonMapper.builder().build())
    private val quests = repository.listAll().associateBy { it.id.value }

    @Test
    fun `同梱した quests_json からメイン・イベント・お天気のクエストを読む`() {
        val kinds = repository.listAll().groupingBy { it.kind.value }.eachCount()

        assertEquals(mapOf("main" to 24, "event" to 6, "weather" to 12), kinds)
    }

    @Test
    fun `メインクエスト A の最初の敵`() {
        val a = quests.getValue("main-a")

        assertEquals(QuestKind.Main, a.kind)
        assertEquals(1, a.order)
        assertEquals("characters/a/main", a.firstStage.imageKey)
        assertEquals(Attribute.YANG, a.firstStage.attribute)
        assertEquals(EnemyAction.DEFEND, a.firstStage.turns.first())
        assertEquals(EnemyAction.DEATHBLOW, a.firstStage.turns.last())
    }

    @Test
    fun `お天気クエストは天気の ID を持つ`() {
        assertEquals(QuestKind.Weather(WeatherId("cloudy")), quests.getValue("weather-cloudy").kind)
    }

    @Test
    fun `I は 2 体の連戦`() {
        val i = quests.getValue("main-i")

        assertEquals(2, i.stages.size)
        assertEquals(listOf(12, 8), i.stages.map { it.turns.size })
    }
}
