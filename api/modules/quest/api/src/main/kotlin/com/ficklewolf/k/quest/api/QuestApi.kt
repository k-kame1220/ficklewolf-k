package com.ficklewolf.k.quest.api

import com.ficklewolf.k.shared.kernel.PlayerId
import com.ficklewolf.k.shared.kernel.QuestId

interface QuestApi {
    fun clear(
        playerId: PlayerId,
        questId: QuestId,
    )
}
