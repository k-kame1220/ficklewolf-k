package com.ficklewolf.k.player.adapter.persistence

import com.ficklewolf.k.player.application.PlayerRepository
import com.ficklewolf.k.player.domain.Player
import com.ficklewolf.k.shared.kernel.PlayerId
import java.util.concurrent.ConcurrentHashMap

class InMemoryPlayerRepository : PlayerRepository {
    private val players = ConcurrentHashMap<PlayerId, Player>()

    override fun save(player: Player) {
        players[player.id] = player
    }

    override fun findById(id: PlayerId): Player? = players[id]
}
