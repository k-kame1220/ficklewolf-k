package com.ficklewolf.k.item.domain

@JvmInline
value class ItemCount private constructor(
    val value: Int,
) : Comparable<ItemCount> {
    operator fun plus(other: ItemCount): ItemCount = ItemCount(value + other.value)

    operator fun minus(other: ItemCount): ItemCount? = of(value - other.value)

    override fun compareTo(other: ItemCount): Int = value.compareTo(other.value)

    companion object {
        val ZERO = ItemCount(0)

        fun of(value: Int): ItemCount? = if (value >= 0) ItemCount(value) else null
    }
}
