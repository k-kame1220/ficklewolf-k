package com.ficklewolf.k.auth.application

import com.ficklewolf.k.auth.domain.AuthToken
import com.ficklewolf.k.auth.domain.TokenHash
import com.ficklewolf.k.character.api.AcquireCharacterResult
import com.ficklewolf.k.character.api.CharacterApi
import com.ficklewolf.k.character.api.CharacterSummary
import com.ficklewolf.k.player.api.CreatePlayerResult
import com.ficklewolf.k.player.api.PlayerApi
import com.ficklewolf.k.player.api.PlayerSummary
import com.ficklewolf.k.shared.kernel.Attribute
import com.ficklewolf.k.shared.kernel.CharacterId
import com.ficklewolf.k.shared.kernel.PlayerId
import com.ficklewolf.k.shared.kernel.TransactionRunner
import java.time.Clock
import java.time.Instant
import java.time.ZoneOffset
import java.util.UUID
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertIs
import kotlin.test.assertNull
import kotlin.test.assertTrue

class AuthServiceTest {
    private val guest = PlayerSummary(PlayerId(UUID.randomUUID()), "ゲスト", 1, 0, CharacterId("zero"))
    private val acquired =
        CharacterSummary(CharacterId("zero"), "ZERO", Attribute.MOON, "キャラクター説明", CharacterSummary.Assets("", "", ""))

    private val playerApi =
        object : PlayerApi {
            override fun create(name: String): CreatePlayerResult =
                if (name == "ゲスト") CreatePlayerResult.Created(guest) else CreatePlayerResult.InvalidName

            override fun find(id: PlayerId): PlayerSummary? = null
        }

    private val acquiredCharacters = mutableListOf<Pair<PlayerId, CharacterId>>()
    private val characterApi =
        object : CharacterApi {
            override fun acquire(
                playerId: PlayerId,
                characterId: CharacterId,
            ): AcquireCharacterResult {
                acquiredCharacters += playerId to characterId
                return AcquireCharacterResult.Acquired(acquired)
            }

            override fun owns(
                playerId: PlayerId,
                characterId: CharacterId,
            ): Boolean = error("使わない")

            override fun getStarterId(): CharacterId = error("使わない")
        }

    private val tokens = mutableMapOf<TokenHash, AuthToken>()
    private val tokenRepository =
        object : AuthTokenRepository {
            override fun save(token: AuthToken) {
                tokens[token.hash] = token
            }

            override fun findByHash(hash: TokenHash): AuthToken? = tokens[hash]
        }

    private val tokenGenerator =
        object : TokenGenerator {
            override fun generate(): String = "token-1"
        }

    private val transaction =
        object : TransactionRunner {
            override fun <T> run(block: () -> T): T = block()
        }

    private val clock = Clock.fixed(Instant.parse("2026-10-04T00:00:00Z"), ZoneOffset.UTC)

    private val service = authService(playerApi, characterApi, tokenRepository, tokenGenerator, transaction, clock)

    @Test
    fun `ゲストを作るとトークン本体を返し、保存するのはハッシュだけ`() {
        val registered = assertIs<RegisterGuestResult.Registered>(service.registerGuest("ゲスト"))

        assertEquals("token-1", registered.token)
        assertEquals(guest, registered.player)
        assertEquals(setOf(TokenHash.of("token-1")), tokens.keys)
        assertEquals(Instant.parse("2026-10-04T00:00:00Z"), tokens.values.single().createdAt)
    }

    @Test
    fun `発行したトークンでプレイヤーを特定できる`() {
        service.registerGuest("ゲスト")

        assertEquals(guest.id, service.authenticate("token-1"))
    }

    @Test
    fun `名前が不正なら InvalidName で、トークンを発行しない`() {
        assertEquals(RegisterGuestResult.InvalidName, service.registerGuest("abcdefg"))
        assertTrue(tokens.isEmpty())
        assertTrue(acquiredCharacters.isEmpty())
    }

    @Test
    fun `知らないトークンは null`() {
        assertNull(service.authenticate("unknown"))
    }

    @Test
    fun `ゲストを作ると、最初のキャラ（ZERO）を持たせる`() {
        service.registerGuest("ゲスト")

        assertEquals(listOf(guest.id to CharacterId("zero")), acquiredCharacters)
    }

    @Test
    fun `最初のキャラがマスタになければ例外になり、トークンを発行しない`() {
        val missingCharacterApi =
            object : CharacterApi {
                override fun acquire(
                    playerId: PlayerId,
                    characterId: CharacterId,
                ): AcquireCharacterResult = AcquireCharacterResult.CharacterNotFound

                override fun owns(
                    playerId: PlayerId,
                    characterId: CharacterId,
                ): Boolean = error("使わない")

                override fun getStarterId(): CharacterId = error("使わない")
            }
        val service = authService(playerApi, missingCharacterApi, tokenRepository, tokenGenerator, transaction, clock)

        assertFailsWith<IllegalStateException> { service.registerGuest("ゲスト") }
        assertTrue(tokens.isEmpty())
    }
}
