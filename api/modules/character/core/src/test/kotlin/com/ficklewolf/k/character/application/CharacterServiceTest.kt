package com.ficklewolf.k.character.application

import com.ficklewolf.k.character.domain.Character
import com.ficklewolf.k.character.domain.CharacterAssets
import com.ficklewolf.k.character.domain.CharacterConfig
import com.ficklewolf.k.character.domain.OwnedCharacter
import com.ficklewolf.k.shared.kernel.Attribute
import com.ficklewolf.k.shared.kernel.CharacterId
import com.ficklewolf.k.shared.kernel.CharacterStatus
import com.ficklewolf.k.shared.kernel.PlayerId
import com.ficklewolf.k.shared.kernel.TransactionRunner
import java.util.UUID
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse
import kotlin.test.assertNull
import kotlin.test.assertTrue

class CharacterServiceTest {
    private val zero = character(no = 1, id = "zero")
    private val a = character(no = 2, id = "a")
    private val b = character(no = 3, id = "b")

    private val masters = listOf(zero, a, b).associateBy { it.id }

    private val characterRepository =
        object : CharacterRepository {
            override fun findById(id: CharacterId): Character? = masters[id]

            override fun listAll(): List<Character> = masters.values.toList()

            override fun listByIds(ids: Collection<CharacterId>): List<Character> = ids.mapNotNull { masters[it] }
        }

    private val ownedCharacters = mutableMapOf<Pair<PlayerId, CharacterId>, OwnedCharacter>()

    private val ownedCharacterRepository =
        object : OwnedCharacterRepository {
            override fun listByPlayerId(playerId: PlayerId): List<OwnedCharacter> =
                ownedCharacters.values.filter { it.playerId == playerId }

            override fun findByPlayerIdAndCharacterId(
                playerId: PlayerId,
                characterId: CharacterId,
            ): OwnedCharacter? = ownedCharacters[playerId to characterId]

            override fun save(ownedCharacter: OwnedCharacter) {
                ownedCharacters[ownedCharacter.playerId to ownedCharacter.characterId] = ownedCharacter
            }
        }

    private var starterCharacterId = CharacterId("zero")

    private val characterConfigRepository =
        object : CharacterConfigRepository {
            override fun load(): CharacterConfig = CharacterConfig(starterCharacterId, CharacterStatus(0, 0, 0))
        }

    private val transaction =
        object : TransactionRunner {
            override fun <T> run(block: () -> T): T = block()
        }

    private val service =
        characterService(characterRepository, ownedCharacterRepository, characterConfigRepository, transaction)

    private val player = PlayerId(UUID.randomUUID())
    private val otherPlayer = PlayerId(UUID.randomUUID())

    @Test
    fun `マスタにあるキャラを手に入れると、持っているキャラになる`() {
        assertEquals(a, service.acquireCharacter(player, a.id))

        assertTrue(service.ownsCharacter(player, a.id))
        assertEquals(listOf(a), service.listOwnedCharacters(player))
    }

    @Test
    fun `マスタにないキャラは手に入らず、何も保存しない`() {
        assertNull(service.acquireCharacter(player, CharacterId("nope")))

        assertTrue(ownedCharacters.isEmpty())
    }

    @Test
    fun `同じキャラを 2 回手に入れても、一覧には 1 回だけ出る`() {
        service.acquireCharacter(player, a.id)
        service.acquireCharacter(player, a.id)

        assertEquals(listOf(a), service.listOwnedCharacters(player))
    }

    @Test
    fun `持っているキャラは、手に入れた順ではなく図鑑の番号順に並ぶ`() {
        service.acquireCharacter(player, b.id)
        service.acquireCharacter(player, zero.id)
        service.acquireCharacter(player, a.id)

        assertEquals(listOf(zero, a, b), service.listOwnedCharacters(player))
    }

    @Test
    fun `ほかのプレイヤーが持っているキャラは、自分の一覧に出ない`() {
        service.acquireCharacter(otherPlayer, a.id)

        assertEquals(emptyList(), service.listOwnedCharacters(player))
        assertFalse(service.ownsCharacter(player, a.id))
    }

    @Test
    fun `最初のキャラは設定の starterCharacterId のキャラ`() {
        assertEquals(zero, service.getStarterCharacter())
    }

    @Test
    fun `最初のキャラがマスタになければ例外（データの誤り）`() {
        starterCharacterId = CharacterId("nope")

        assertFailsWith<IllegalStateException> { service.getStarterCharacter() }
    }

    private fun character(
        no: Int,
        id: String,
    ): Character =
        Character(
            no = no,
            id = CharacterId(id),
            name = id.uppercase(),
            attribute = Attribute.MOON,
            description = "",
            assets = CharacterAssets("characters/$id/main", "characters/$id/icon", "characters/$id/home"),
        )
}
