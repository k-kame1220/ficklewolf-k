package com.ficklewolf.k.quest.domain

import com.ficklewolf.k.shared.kernel.Attribute
import com.ficklewolf.k.shared.kernel.EnemyAction

data class QuestStage(
    val imageKey: String,
    val attribute: Attribute,
    val turns: List<EnemyAction>,
    val revealCount: Int,
)
