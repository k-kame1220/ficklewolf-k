package com.ficklewolf.k.quest.application

import com.ficklewolf.k.quest.domain.QuestConfig

interface QuestConfigRepository {
    fun load(): QuestConfig
}
