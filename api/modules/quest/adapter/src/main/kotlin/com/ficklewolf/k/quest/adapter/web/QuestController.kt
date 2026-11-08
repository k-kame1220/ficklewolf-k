package com.ficklewolf.k.quest.adapter.web

import com.ficklewolf.k.platform.web.security.AuthenticatedPlayer
import com.ficklewolf.k.platform.web.security.CurrentPlayer
import com.ficklewolf.k.quest.application.QuestService
import com.ficklewolf.k.quest.domain.AvailableQuest
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

data class MyQuestResponse(
    val id: String,
    val kind: String,
    val name: String,
    val imageKey: String,
    val attribute: String,
    val stageCount: Int,
    val turnCount: Int,
    val revealCount: Int,
    val isCleared: Boolean,
)

data class MyQuestListResponse(
    val quests: List<MyQuestResponse>,
)

@RestController
class QuestController(
    private val questService: QuestService,
) {
    @GetMapping("/me/quests")
    fun listMyQuests(
        @CurrentPlayer player: AuthenticatedPlayer,
    ): ResponseEntity<MyQuestListResponse> {
        val quests = questService.listAvailableQuests(player.playerId)
        return ResponseEntity.ok(MyQuestListResponse(quests.map { it.toResponse() }))
    }
}

private fun AvailableQuest.toResponse(): MyQuestResponse =
    MyQuestResponse(
        id = quest.id.value,
        kind = quest.kind.value,
        name = quest.name,
        imageKey = quest.firstStage.imageKey,
        attribute = quest.firstStage.attribute.value,
        stageCount = quest.stages.size,
        turnCount = quest.firstStage.turns.size,
        revealCount = quest.firstStage.revealCount,
        isCleared = isCleared,
    )
