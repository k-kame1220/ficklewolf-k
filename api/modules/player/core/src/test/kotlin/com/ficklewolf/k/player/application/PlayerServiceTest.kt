package com.ficklewolf.k.player.application

import com.ficklewolf.k.player.domain.Player
import com.ficklewolf.k.player.domain.PlayerName
import com.ficklewolf.k.shared.kernel.PlayerId
import com.ficklewolf.k.shared.kernel.TransactionRunner
import java.util.UUID
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull

class PlayerServiceTest {
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

    private val service = playerService(repository, transaction)

    @Test
    fun `作ったプレイヤーは Lv 1・お札 0・ZERO で始まり、あとで取れる`() {
        val name = PlayerName.of("ゲスト") ?: error("名前が使えない")

        val created = service.createPlayer(name)

        assertEquals(1, created.level)
        assertEquals(0, created.fuda)
        assertEquals("zero", created.selectedCharacterId)
        assertEquals(created, service.find(created.id))
    }

    @Test
    fun `名前を変えると保存され、あとで取ると新しい名前になる`() {
        val created = service.createPlayer(PlayerName.of("ゲスト") ?: error("名前が使えない"))
        val newName = PlayerName.of("ウルフ") ?: error("名前が使えない")

        val renamed = service.rename(created.id, newName)

        assertEquals("ウルフ", renamed?.name?.value)
        assertEquals("ウルフ", service.find(created.id)?.name?.value)
    }

    @Test
    fun `いないプレイヤーの名前は変えられない`() {
        val newName = PlayerName.of("ウルフ") ?: error("名前が使えない")

        assertNull(service.rename(PlayerId(UUID.randomUUID()), newName))
    }
}
