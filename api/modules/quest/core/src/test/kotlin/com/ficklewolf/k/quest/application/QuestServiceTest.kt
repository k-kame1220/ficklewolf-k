package com.ficklewolf.k.quest.application

import com.ficklewolf.k.player.api.CreatePlayerResult
import com.ficklewolf.k.player.api.PlayerApi
import com.ficklewolf.k.player.api.PlayerSummary
import com.ficklewolf.k.quest.domain.Quest
import com.ficklewolf.k.quest.domain.QuestKind
import com.ficklewolf.k.quest.domain.QuestStage
import com.ficklewolf.k.shared.kernel.Attribute
import com.ficklewolf.k.shared.kernel.CharacterId
import com.ficklewolf.k.shared.kernel.EnemyAction
import com.ficklewolf.k.shared.kernel.PlayerId
import com.ficklewolf.k.shared.kernel.QuestId
import com.ficklewolf.k.shared.kernel.Stats
import com.ficklewolf.k.shared.kernel.WeatherId
import com.ficklewolf.k.weather.api.TodayWeatherSummary
import com.ficklewolf.k.weather.api.WeatherApi
import java.util.UUID
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertTrue

class QuestServiceTest {
    private val player = PlayerId(UUID.randomUUID())
    private var level = 1

    private val playerApi =
        object : PlayerApi {
            override fun find(id: PlayerId): PlayerSummary? =
                if (id == player) PlayerSummary(player, "ゲスト", level, 0, CharacterId("zero")) else null

            override fun create(name: String): CreatePlayerResult = error("使わない")
        }

    private var todayWeatherId = WeatherId("cloudy")

    private val weatherApi =
        object : WeatherApi {
            override fun getToday(): TodayWeatherSummary =
                TodayWeatherSummary(todayWeatherId, Attribute.MOON, Stats.ZERO)
        }

    /** わざと order の順にしない（並べるのは Service の仕事） */
    private val masters =
        listOf(
            quest("main-c", 3, QuestKind.Main),
            quest("main-a", 1, QuestKind.Main),
            quest("event-w", 1, QuestKind.Event),
            quest("weather-sunny", 1, QuestKind.Weather(WeatherId("sunny"))),
            quest("main-b", 2, QuestKind.Main),
            quest("weather-cloudy", 2, QuestKind.Weather(WeatherId("cloudy"))),
        )

    private val questRepository =
        object : QuestRepository {
            override fun listAll(): List<Quest> = masters
        }

    private val service = questService(playerApi, weatherApi, questRepository)

    @Test
    fun `Lv1 ならメインクエストは 1 つめだけで、今日のお天気クエストも出る`() {
        val quests = service.listAvailableQuests(player)

        assertEquals(listOf("main-a", "weather-cloudy"), quests.map { it.quest.id.value })
    }

    @Test
    fun `メインクエストは Lv の数だけ、order の順に出る`() {
        level = 3

        val quests = service.listAvailableQuests(player)

        assertEquals(listOf("main-a", "main-b", "main-c", "weather-cloudy"), quests.map { it.quest.id.value })
    }

    @Test
    fun `お天気クエストは今日の天気のものだけ出る`() {
        todayWeatherId = WeatherId("sunny")

        val quests = service.listAvailableQuests(player)

        assertEquals(listOf("main-a", "weather-sunny"), quests.map { it.quest.id.value })
    }

    @Test
    fun `イベントクエストはまだ出さない（フェーズ 1_5）`() {
        level = 3

        val kinds = service.listAvailableQuests(player).map { it.quest.kind }

        assertTrue(QuestKind.Event !in kinds)
    }

    @Test
    fun `クリアの記録はまだ無いので、どれもクリアしていない`() {
        val quests = service.listAvailableQuests(player)

        assertTrue(quests.none { it.isCleared })
    }

    @Test
    fun `プレイヤーがいなければ例外（ログインしているのにいないのはバグ）`() {
        assertFailsWith<IllegalStateException> { service.listAvailableQuests(PlayerId(UUID.randomUUID())) }
    }

    private fun quest(
        id: String,
        order: Int,
        kind: QuestKind,
    ): Quest =
        Quest(
            id = QuestId(id),
            name = id,
            order = order,
            kind = kind,
            stages = listOf(QuestStage("characters/$id/main", Attribute.YANG, listOf(EnemyAction.DEATHBLOW), 1)),
        )
}
