package com.ficklewolf.k.shared.kernel

enum class EnemyAction(
    val value: String,
) {
    ATTACK("attack"),
    ATTACK_BUFF("attackBuff"),
    ATTACK_DEBUFF("attackDebuff"),
    CHANGE_ATTRIBUTE("changeAttribute"),
    CONCENTRATION("concentration"),
    DEATHBLOW("deathblow"),
    DEFENCE_BUFF("defenceBuff"),
    DEFENCE_DEBUFF("defenceDebuff"),
    DEFEND("defend"),
    FIXED_ATTACK("fixedAttack"),
    FULL_RECOVERY("fullRecovery"),
    NUMBNESS("numbness"),
    PROVOCATION("provocation"),
    RATE_RECOVERY("rateRecovery"),
    STRONG_ATTACK("strongAttack"),
    ;

    companion object {
        private val byValue = entries.associateBy { it.value }

        fun of(value: String): EnemyAction? = byValue[value]
    }
}
