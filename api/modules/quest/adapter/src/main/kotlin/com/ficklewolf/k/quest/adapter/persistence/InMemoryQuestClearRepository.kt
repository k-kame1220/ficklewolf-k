package com.ficklewolf.k.quest.adapter.persistence

import com.ficklewolf.k.quest.application.QuestClearRepository
import com.ficklewolf.k.quest.domain.QuestClear
import com.ficklewolf.k.shared.kernel.PlayerId
import com.ficklewolf.k.shared.kernel.QuestId
import java.util.concurrent.ConcurrentHashMap

class InMemoryQuestClearRepository : QuestClearRepository {
    private val questClears = ConcurrentHashMap<PlayerId, Map<QuestId, QuestClear>>()

    override fun listByPlayerId(playerId: PlayerId): List<QuestClear> =
        questClears[playerId]?.values?.toList().orEmpty()

    override fun findByPlayerIdAndQuestId(
        playerId: PlayerId,
        questId: QuestId,
    ): QuestClear? = questClears[playerId]?.get(questId)

    override fun save(questClear: QuestClear) {
        questClears.merge(questClear.playerId, mapOf(questClear.questId to questClear)) { current, added ->
            current +
                added
        }
    }
}
