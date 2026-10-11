package com.ficklewolf.k.character.application

import com.ficklewolf.k.character.api.AcquireCharacterResult
import com.ficklewolf.k.character.api.CharacterSummary
import com.ficklewolf.k.character.domain.Character
import com.ficklewolf.k.character.domain.CharacterAssets
import com.ficklewolf.k.shared.kernel.Attribute
import com.ficklewolf.k.shared.kernel.CharacterId
import com.ficklewolf.k.shared.kernel.PlayerId
import java.util.UUID
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class CharacterApiTest {
    private val zero =
        Character(
            no = 1,
            id = CharacterId("zero"),
            name = "ZERO",
            attribute = Attribute.MOON,
            description = "説明",
            assets = CharacterAssets("characters/zero/main", "characters/zero/icon", "characters/zero/home"),
        )

    private val owned = mutableSetOf<Pair<PlayerId, CharacterId>>()

    private val characterService =
        object : CharacterService {
            override fun findCharacter(id: CharacterId): Character? = if (id == zero.id) zero else null

            override fun listOwnedCharacters(playerId: PlayerId): List<Character> = error("使わない")

            override fun ownsCharacter(
                playerId: PlayerId,
                characterId: CharacterId,
            ): Boolean = (playerId to characterId) in owned

            override fun acquireCharacter(
                playerId: PlayerId,
                characterId: CharacterId,
            ): Character? = findCharacter(characterId)?.also { owned += playerId to it.id }

            override fun getStarterCharacter(): Character = zero
        }

    private val api = characterApi(characterService)

    private val player = PlayerId(UUID.randomUUID())

    @Test
    fun `手に入れたキャラを外向けの形で返す`() {
        val expected =
            CharacterSummary(
                id = CharacterId("zero"),
                name = "ZERO",
                attribute = Attribute.MOON,
                description = "説明",
                assets =
                    CharacterSummary.Assets(
                        "characters/zero/main",
                        "characters/zero/icon",
                        "characters/zero/home",
                    ),
            )

        assertEquals(AcquireCharacterResult.Acquired(expected), api.acquire(player, CharacterId("zero")))
        assertTrue(api.owns(player, CharacterId("zero")))
    }

    @Test
    fun `マスタにないキャラは CharacterNotFound`() {
        assertEquals(AcquireCharacterResult.CharacterNotFound, api.acquire(player, CharacterId("nope")))
        assertFalse(api.owns(player, CharacterId("nope")))
    }

    @Test
    fun `最初のキャラは ID だけを返す`() {
        assertEquals(CharacterId("zero"), api.getStarterId())
    }
}
