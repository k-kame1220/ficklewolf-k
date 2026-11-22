package com.ficklewolf.k.quest.application

import com.ficklewolf.k.player.api.CreatePlayerResult
import com.ficklewolf.k.player.api.PlayerApi
import com.ficklewolf.k.player.api.PlayerSummary
import com.ficklewolf.k.quest.domain.Quest
import com.ficklewolf.k.quest.domain.QuestClear
import com.ficklewolf.k.quest.domain.QuestConfig
import com.ficklewolf.k.quest.domain.QuestKind
import com.ficklewolf.k.quest.domain.QuestStage
import com.ficklewolf.k.shared.kernel.Attribute
import com.ficklewolf.k.shared.kernel.CharacterId
import com.ficklewolf.k.shared.kernel.EnemyAction
import com.ficklewolf.k.shared.kernel.PlayerId
import com.ficklewolf.k.shared.kernel.QuestId
import com.ficklewolf.k.shared.kernel.Stats
import com.ficklewolf.k.shared.kernel.TransactionRunner
import com.ficklewolf.k.shared.kernel.WeatherId
import com.ficklewolf.k.weather.api.TodayWeatherSummary
import com.ficklewolf.k.weather.api.WeatherApi
import java.time.Clock
import java.time.Instant
import java.time.ZoneOffset
import java.util.UUID
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertTrue

class QuestServiceTest {
    private val player = PlayerId(UUID.randomUUID())
    private var level = 1
    private var fuda = 0

    private val playerApi =
        object : PlayerApi {
            override fun find(id: PlayerId): PlayerSummary? = if (id == player) summary() else null

            override fun create(name: String): CreatePlayerResult = error("使わない")

            override fun levelUp(id: PlayerId): PlayerSummary {
                level += 1
                return summary()
            }

            override fun addFuda(
                id: PlayerId,
                amount: Int,
            ): PlayerSummary {
                fuda += amount
                return summary()
            }

            private fun summary(): PlayerSummary = PlayerSummary(player, "ゲスト", level, fuda, CharacterId("zero"))
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

    private val clears = mutableMapOf<Pair<PlayerId, QuestId>, QuestClear>()

    private val questClearRepository =
        object : QuestClearRepository {
            override fun listByPlayerId(playerId: PlayerId): List<QuestClear> =
                clears.values.filter { it.playerId == playerId }

            override fun findByPlayerIdAndQuestId(
                playerId: PlayerId,
                questId: QuestId,
            ): QuestClear? = clears[playerId to questId]

            override fun save(questClear: QuestClear) {
                clears[questClear.playerId to questClear.questId] = questClear
            }
        }

    private val transaction =
        object : TransactionRunner {
            override fun <T> run(block: () -> T): T = block()
        }

    private var now = Instant.parse("2026-11-01T00:00:00Z")

    /** 呼ぶたびに `now` を返す（テストの中で時刻を進められるように） */
    private val clock =
        object : Clock() {
            override fun getZone() = ZoneOffset.UTC

            override fun withZone(zone: java.time.ZoneId?): Clock = this

            override fun instant(): Instant = now
        }

    /** 偶数の Lv になったときのお札は 3 枚（settings.json の値ではなく、ここで決めた値が使われることを確かめる） */
    private val questConfigRepository =
        object : QuestConfigRepository {
            override fun load(): QuestConfig = QuestConfig(1.0, 0.2, 0, 3, fudaPerEvenLevel = 3)
        }

    private val service =
        questService(
            playerApi,
            weatherApi,
            questRepository,
            questClearRepository,
            questConfigRepository,
            transaction,
            clock,
        )

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
    fun `まだクリアしていなければ、どれもクリアしていない`() {
        val quests = service.listAvailableQuests(player)

        assertTrue(quests.none { it.isCleared })
    }

    @Test
    fun `クリアしたクエストは、一覧でクリア済みになり、Lv が上がって次のメインクエストが出る`() {
        service.clearQuest(player, QuestId("main-a"))

        val cleared = service.listAvailableQuests(player).associate { it.quest.id.value to it.isCleared }

        assertEquals(mapOf("main-a" to true, "main-b" to false, "weather-cloudy" to false), cleared)
    }

    @Test
    fun `初めてのクリアは 1 回目で、そのときの時刻を初クリアの日時にする`() {
        val cleared = service.clearQuest(player, QuestId("main-a"))

        assertEquals(1, cleared.count)
        assertEquals(Instant.parse("2026-11-01T00:00:00Z"), cleared.firstClearedAt)
    }

    @Test
    fun `2 回目のクリアは回数だけが増え、初クリアの日時は変わらない`() {
        service.clearQuest(player, QuestId("main-a"))
        now = Instant.parse("2026-11-02T00:00:00Z")

        val cleared = service.clearQuest(player, QuestId("main-a"))

        assertEquals(2, cleared.count)
        assertEquals(Instant.parse("2026-11-01T00:00:00Z"), cleared.firstClearedAt)
        assertEquals(listOf(2), questClearRepository.listByPlayerId(player).map { it.count })
    }

    @Test
    fun `ほかのプレイヤーのクリアは、自分の一覧に出ない`() {
        service.clearQuest(PlayerId(UUID.randomUUID()), QuestId("main-a"))

        assertTrue(service.listAvailableQuests(player).none { it.isCleared })
    }

    @Test
    fun `プレイヤーがいなければ例外（ログインしているのにいないのはバグ）`() {
        assertFailsWith<IllegalStateException> { service.listAvailableQuests(PlayerId(UUID.randomUUID())) }
    }

    @Test
    fun `メインクエストを初めてクリアすると Lv が上がり、偶数になったらお札をもらう`() {
        service.clearQuest(player, QuestId("main-a"))

        assertEquals(2, level)
        assertEquals(3, fuda)
    }

    @Test
    fun `上がった Lv が奇数なら、お札はもらえない`() {
        level = 2

        service.clearQuest(player, QuestId("main-b"))

        assertEquals(3, level)
        assertEquals(0, fuda)
    }

    @Test
    fun `同じメインクエストを 2 回目にクリアしても、Lv もお札も増えない`() {
        service.clearQuest(player, QuestId("main-a"))

        service.clearQuest(player, QuestId("main-a"))

        assertEquals(2, level)
        assertEquals(3, fuda)
    }

    @Test
    fun `お天気クエストやイベントクエストを初めてクリアしても、Lv は上がらない`() {
        service.clearQuest(player, QuestId("weather-cloudy"))
        service.clearQuest(player, QuestId("event-w"))

        assertEquals(1, level)
        assertEquals(0, fuda)
    }

    @Test
    fun `マスタにないクエストは例外で、何も記録しない（呼ぶ側のバグ）`() {
        assertFailsWith<IllegalStateException> { service.clearQuest(player, QuestId("nope")) }
        assertTrue(questClearRepository.listByPlayerId(player).isEmpty())
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
