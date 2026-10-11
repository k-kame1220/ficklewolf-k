package com.ficklewolf.k.player.api

import com.ficklewolf.k.shared.kernel.PlayerId

interface PlayerApi {
    fun find(id: PlayerId): PlayerSummary?

    fun create(name: String): CreatePlayerResult
}
