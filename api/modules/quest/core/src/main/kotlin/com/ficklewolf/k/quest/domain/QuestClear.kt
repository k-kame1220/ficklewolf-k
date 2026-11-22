package com.ficklewolf.k.quest.domain

import com.ficklewolf.k.shared.kernel.PlayerId
import com.ficklewolf.k.shared.kernel.QuestId
import java.time.Instant

data class QuestClear(
    val playerId: PlayerId,
    val questId: QuestId,
    val count: Int,
    val firstClearedAt: Instant,
) {
    fun recordClear(): QuestClear = copy(count = count + 1)

    companion object {
        fun first(
            playerId: PlayerId,
            questId: QuestId,
            clearedAt: Instant,
        ): QuestClear = QuestClear(playerId, questId, count = 1, firstClearedAt = clearedAt)
    }
}
