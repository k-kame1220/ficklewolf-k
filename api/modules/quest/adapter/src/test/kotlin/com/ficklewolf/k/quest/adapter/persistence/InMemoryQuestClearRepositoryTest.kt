package com.ficklewolf.k.quest.adapter.persistence

import com.ficklewolf.k.quest.domain.QuestClear
import com.ficklewolf.k.shared.kernel.PlayerId
import com.ficklewolf.k.shared.kernel.QuestId
import java.time.Instant
import java.util.UUID
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull

class InMemoryQuestClearRepositoryTest {
    private val repository = InMemoryQuestClearRepository()

    private val player = PlayerId(UUID.randomUUID())
    private val otherPlayer = PlayerId(UUID.randomUUID())
    private val questA = QuestId("main-a")
    private val questB = QuestId("main-b")
    private val clearedAt = Instant.parse("2026-11-01T00:00:00Z")

    @Test
    fun `保存した記録を、プレイヤーとクエストで引ける。無ければ null`() {
        val clear = QuestClear.first(player, questA, clearedAt)

        repository.save(clear)

        assertEquals(clear, repository.findByPlayerIdAndQuestId(player, questA))
        assertNull(repository.findByPlayerIdAndQuestId(player, questB))
        assertNull(repository.findByPlayerIdAndQuestId(otherPlayer, questA))
    }

    @Test
    fun `同じクエストを保存し直すと、新しい記録で置き換わる`() {
        repository.save(QuestClear.first(player, questA, clearedAt))
        repository.save(QuestClear.first(player, questA, clearedAt).recordClear())

        assertEquals(listOf(2), repository.listByPlayerId(player).map { it.count })
    }

    @Test
    fun `一覧はプレイヤーごとに分かれ、別のクエストの記録は消えない`() {
        repository.save(QuestClear.first(player, questA, clearedAt))
        repository.save(QuestClear.first(player, questB, clearedAt))
        repository.save(QuestClear.first(otherPlayer, questA, clearedAt))

        assertEquals(setOf(questA, questB), repository.listByPlayerId(player).map { it.questId }.toSet())
        assertEquals(listOf(questA), repository.listByPlayerId(otherPlayer).map { it.questId })
    }
}
