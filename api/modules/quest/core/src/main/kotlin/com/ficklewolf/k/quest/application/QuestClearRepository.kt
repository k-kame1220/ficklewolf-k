package com.ficklewolf.k.quest.application

import com.ficklewolf.k.quest.domain.QuestClear
import com.ficklewolf.k.shared.kernel.PlayerId
import com.ficklewolf.k.shared.kernel.QuestId

interface QuestClearRepository {
    fun listByPlayerId(playerId: PlayerId): List<QuestClear>

    fun findByPlayerIdAndQuestId(
        playerId: PlayerId,
        questId: QuestId,
    ): QuestClear?

    fun save(questClear: QuestClear)
}
