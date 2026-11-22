package com.ficklewolf.k.quest.application

import com.ficklewolf.k.quest.api.QuestApi
import com.ficklewolf.k.shared.kernel.PlayerId
import com.ficklewolf.k.shared.kernel.QuestId

fun questApi(questService: QuestService): QuestApi = DefaultQuestApi(questService)

internal class DefaultQuestApi(
    private val questService: QuestService,
) : QuestApi {
    override fun clear(
        playerId: PlayerId,
        questId: QuestId,
    ) {
        questService.clearQuest(playerId, questId)
    }
}
