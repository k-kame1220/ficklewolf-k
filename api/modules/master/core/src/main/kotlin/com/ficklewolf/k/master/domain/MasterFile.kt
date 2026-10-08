package com.ficklewolf.k.master.domain

class MasterFile(
    val name: String,
    val content: ByteArray,
) {
    companion object {
        val NAMES = listOf("attributes", "characters", "items", "quests", "settings", "weathers")
    }
}
