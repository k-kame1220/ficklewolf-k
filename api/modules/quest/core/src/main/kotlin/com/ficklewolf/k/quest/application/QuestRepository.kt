package com.ficklewolf.k.quest.application

import com.ficklewolf.k.quest.domain.Quest

interface QuestRepository {
    fun listAll(): List<Quest>
}
