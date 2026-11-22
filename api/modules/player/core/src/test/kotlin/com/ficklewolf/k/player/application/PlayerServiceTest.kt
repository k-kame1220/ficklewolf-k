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
import kotlin.test.assertFailsWith
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

    @Test
    fun `Lv を上げると 1 上がり、保存される`() {
        val created = service.createPlayer(PlayerName.of("ゲスト") ?: error("名前が使えない"))

        val updated = service.levelUpPlayer(created.id)

        assertEquals(2, updated.level)
        assertEquals(2, service.findPlayer(created.id)?.level)
    }

    @Test
    fun `お札を足すと、その枚数だけ増えて保存される`() {
        val created = service.createPlayer(PlayerName.of("ゲスト") ?: error("名前が使えない"))

        service.addPlayerFuda(created.id, 1)
        val updated = service.addPlayerFuda(created.id, 2)

        assertEquals(3, updated.fuda)
        assertEquals(3, service.findPlayer(created.id)?.fuda)
    }

    @Test
    fun `0 枚以下のお札は足せない（呼ぶ側のバグ）`() {
        val created = service.createPlayer(PlayerName.of("ゲスト") ?: error("名前が使えない"))

        assertFailsWith<IllegalArgumentException> { service.addPlayerFuda(created.id, 0) }
        assertEquals(0, service.findPlayer(created.id)?.fuda)
    }

    @Test
    fun `いないプレイヤーの Lv やお札は変えられない（呼ぶ側のバグ）`() {
        val nobody = PlayerId(UUID.randomUUID())

        assertFailsWith<IllegalStateException> { service.levelUpPlayer(nobody) }
        assertFailsWith<IllegalStateException> { service.addPlayerFuda(nobody, 1) }
    }
}
