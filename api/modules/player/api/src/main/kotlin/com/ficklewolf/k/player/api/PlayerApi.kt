package com.ficklewolf.k.player.api

import com.ficklewolf.k.shared.kernel.PlayerId

interface PlayerApi {
    fun createPlayer(name: String): CreatePlayerResult

    fun find(id: PlayerId): PlayerSummary?
}
