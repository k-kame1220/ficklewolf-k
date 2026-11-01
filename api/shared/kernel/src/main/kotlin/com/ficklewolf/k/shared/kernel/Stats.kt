package com.ficklewolf.k.shared.kernel

data class Stats(
    val hp: Int,
    val attack: Int,
    val defence: Int,
) {
    operator fun get(stat: Stat): Int =
        when (stat) {
            Stat.HP -> hp
            Stat.ATTACK -> attack
            Stat.DEFENCE -> defence
        }

    operator fun plus(other: Stats): Stats =
        copy(
            hp = hp + other.hp,
            attack = attack + other.attack,
            defence =
                defence + other.defence,
        )

    operator fun times(other: Stats): Stats =
        copy(
            hp = hp * other.hp,
            attack = attack * other.attack,
            defence = defence * other.defence,
        )

    fun plus(
        stat: Stat,
        amount: Int,
    ): Stats =
        when (stat) {
            Stat.HP -> copy(hp = hp + amount)
            Stat.ATTACK -> copy(attack = attack + amount)
            Stat.DEFENCE -> copy(defence = defence + amount)
        }

    companion object {
        val ZERO = Stats(0, 0, 0)
    }
}
