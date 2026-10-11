package com.ficklewolf.k.player.application

import com.ficklewolf.k.character.api.AcquireCharacterResult
import com.ficklewolf.k.character.api.CharacterApi
import com.ficklewolf.k.player.domain.Player
import com.ficklewolf.k.player.domain.PlayerName
import com.ficklewolf.k.shared.kernel.CharacterId
import com.ficklewolf.k.shared.kernel.PlayerId
import com.ficklewolf.k.shared.kernel.TransactionRunner
import java.util.UUID
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertIs

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

    private val ownedCharacterIds = mutableSetOf(CharacterId("zero"))

    private val characterApi =
        object : CharacterApi {
            override fun owns(
                playerId: PlayerId,
                characterId: CharacterId,
            ): Boolean = characterId in ownedCharacterIds

            override fun acquire(
                playerId: PlayerId,
                characterId: CharacterId,
            ): AcquireCharacterResult = error("使わない")

            override fun getStarterId(): CharacterId = CharacterId("zero")
        }

    private val service = playerService(characterApi, repository, transaction)

    @Test
    fun `名前を変えると保存され、あとで取ると新しい名前になる`() {
        val created = service.createPlayer(PlayerName.of("ゲスト") ?: error("名前が使えない"))
        val newName = PlayerName.of("ウルフ") ?: error("名前が使えない")

        val updated = assertIs<UpdatePlayerResult.Updated>(service.updatePlayer(created.id, newName, null)).player

        assertEquals("ウルフ", updated.name.value)
        assertEquals("ウルフ", service.findPlayer(created.id)?.name?.value)
    }

    @Test
    fun `いないプレイヤーは PlayerNotFound`() {
        val newName = PlayerName.of("ウルフ") ?: error("名前が使えない")

        assertEquals(
            UpdatePlayerResult.PlayerNotFound,
            service.updatePlayer(PlayerId(UUID.randomUUID()), newName, null),
        )
    }

    @Test
    fun `持っているキャラなら出撃キャラにできる`() {
        val created = service.createPlayer(PlayerName.of("ゲスト") ?: error("名前が使えない"))
        ownedCharacterIds += CharacterId("a")

        val updated =
            assertIs<UpdatePlayerResult.Updated>(
                service.updatePlayer(created.id, null, CharacterId("a")),
            ).player

        assertEquals(CharacterId("a"), updated.selectedCharacterId)
    }

    @Test
    fun `持っていないキャラなら CharacterNotOwned で、名前も変えない`() {
        val created = service.createPlayer(PlayerName.of("ゲスト") ?: error("名前が使えない"))
        val newName = PlayerName.of("ウルフ") ?: error("名前が使えない")

        val result = service.updatePlayer(created.id, newName, CharacterId("a"))

        assertEquals(UpdatePlayerResult.CharacterNotOwned, result)
        assertEquals(created, service.findPlayer(created.id))
    }
}
