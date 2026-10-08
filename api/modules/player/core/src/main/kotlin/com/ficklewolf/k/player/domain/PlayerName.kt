package com.ficklewolf.k.player.domain

@JvmInline
value class PlayerName private constructor(
    val value: String,
) {
    companion object {
        const val MAX_LENGTH = 6

        fun of(raw: String): PlayerName? {
            val name = raw.trim()
            val length = name.codePointCount(0, name.length)
            if (length !in 1..MAX_LENGTH) return null
            if (name.codePoints().anyMatch { Character.isISOControl(it) }) return null
            return PlayerName(name)
        }
    }
}
