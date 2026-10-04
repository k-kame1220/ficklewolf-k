package com.ficklewolf.k.player.application

import com.ficklewolf.k.player.domain.Player
import com.ficklewolf.k.shared.kernel.PlayerId

interface PlayerRepository {
    fun save(player: Player)

    fun findById(id: PlayerId): Player?
}
