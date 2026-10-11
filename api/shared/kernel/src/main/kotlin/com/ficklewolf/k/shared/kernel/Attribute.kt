package com.ficklewolf.k.shared.kernel

enum class Attribute(
    val value: String,
) {
    MOON("moon"),
    YANG("yang"),
    NOTE("note"),
    ;

    companion object {
        private val byValue = entries.associateBy { it.value }

        fun of(value: String): Attribute? = byValue[value]
    }
}
