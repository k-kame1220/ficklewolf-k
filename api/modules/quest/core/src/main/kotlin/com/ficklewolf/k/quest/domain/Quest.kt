package com.ficklewolf.k.quest.domain

import com.ficklewolf.k.shared.kernel.QuestId
import com.ficklewolf.k.shared.kernel.WeatherId

data class Quest(
    val id: QuestId,
    val name: String,
    val order: Int,
    val kind: QuestKind,
    val stages: List<QuestStage>,
) {
    val firstStage: QuestStage get() = stages.first()
}

sealed interface QuestKind {
    val value: String

    data object Main : QuestKind {
        override val value = "main"
    }

    data object Event : QuestKind {
        override val value = "event"
    }

    data class Weather(
        val weatherId: WeatherId,
    ) : QuestKind {
        override val value = "weather"
    }
}
