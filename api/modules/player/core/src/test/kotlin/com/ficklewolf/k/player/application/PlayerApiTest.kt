package com.ficklewolf.k.player.application

import com.ficklewolf.k.player.api.CreatePlayerResult
import com.ficklewolf.k.player.domain.Player
import com.ficklewolf.k.shared.kernel.PlayerId
import com.ficklewolf.k.shared.kernel.TransactionRunner
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertIs
import kotlin.test.assertTrue

class PlayerApiTest {
    private val players = mutableMapOf<PlayerId, Player>()

    private val repository =
        object : PlayerRepository {
            override fun save(player: Player) {
                players[player.id] = player
            }

            override fun findById(id: PlayerId): Player? = players[id]
        }

    private val transaction =
        object : TransactionRunner {
            override fun <T> run(block: () -> T): T = block()
        }

    private val api = playerApi(playerService(repository, transaction))

    @Test
    fun `名前を文字列で受け取り、外向けの形で返す`() {
        val created = assertIs<CreatePlayerResult.Created>(api.createPlayer("  ゲスト  ")).player

        assertEquals("ゲスト", created.name)
        assertEquals(created, api.find(created.id))
    }

    @Test
    fun `名前が使えなければ InvalidName で、保存しない`() {
        assertEquals(CreatePlayerResult.InvalidName, api.createPlayer("abcdefg"))
        assertTrue(players.isEmpty())
    }
}
