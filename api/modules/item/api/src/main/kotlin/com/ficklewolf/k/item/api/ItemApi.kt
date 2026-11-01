package com.ficklewolf.k.item.api

import com.ficklewolf.k.shared.kernel.Attribute
import com.ficklewolf.k.shared.kernel.PlayerId
import com.ficklewolf.k.shared.kernel.Stats

interface ItemApi {
    fun consume(
        playerId: PlayerId,
        attribute: Attribute,
        counts: Stats,
    ): ConsumeResult

    fun acquireStarter(playerId: PlayerId)
}
