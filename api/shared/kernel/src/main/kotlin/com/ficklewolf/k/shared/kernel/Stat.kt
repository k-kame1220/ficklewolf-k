package com.ficklewolf.k.shared.kernel

enum class Stat(
    val value: String,
) {
    HP("hp"),
    ATTACK("attack"),
    DEFENCE("defence"),
    ;

    companion object {
        private val byValue = entries.associateBy { it.value }

        fun of(value: String): Stat? = byValue[value]
    }
}
