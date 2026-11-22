package com.ficklewolf.k.quest.domain

data class QuestConfig(
    val firstClearRecruitRate: Double,
    val repeatRecruitRate: Double,
    val weatherItemDropMin: Int,
    val weatherItemDropMax: Int,
    val fudaPerEvenLevel: Int,
)
