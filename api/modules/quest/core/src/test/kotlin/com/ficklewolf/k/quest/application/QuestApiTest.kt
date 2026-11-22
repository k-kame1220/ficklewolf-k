package com.ficklewolf.k.quest.application

import com.ficklewolf.k.quest.domain.AvailableQuest
import com.ficklewolf.k.quest.domain.QuestClear
import com.ficklewolf.k.shared.kernel.PlayerId
import com.ficklewolf.k.shared.kernel.QuestId
import java.time.Instant
import java.util.UUID
import kotlin.test.Test
import kotlin.test.assertEquals

class QuestApiTest {
    private val cleared = mutableListOf<Pair<PlayerId, QuestId>>()

    private val questService =
        object : QuestService {
            override fun listAvailableQuests(playerId: PlayerId): List<AvailableQuest> = error("使わない")

            override fun clearQuest(
                playerId: PlayerId,
                questId: QuestId,
            ): QuestClear {
                cleared += playerId to questId
                return QuestClear.first(playerId, questId, Instant.EPOCH)
            }
        }

    private val api = questApi(questService)

    @Test
    fun `クリアを知らせると、そのプレイヤーとクエストでクリアを記録する`() {
        val player = PlayerId(UUID.randomUUID())

        api.clear(player, QuestId("main-a"))

        assertEquals(listOf(player to QuestId("main-a")), cleared)
    }
}
