package com.ficklewolf.k.character.adapter.persistence

import com.ficklewolf.k.character.domain.OwnedCharacter
import com.ficklewolf.k.shared.kernel.CharacterId
import com.ficklewolf.k.shared.kernel.PlayerId
import java.util.UUID
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull

class InMemoryOwnedCharacterRepositoryTest {
    private val repository = InMemoryOwnedCharacterRepository()

    private val player = PlayerId(UUID.randomUUID())
    private val otherPlayer = PlayerId(UUID.randomUUID())

    @Test
    fun `同じプレイヤーの同じキャラを 2 回保存しても 1 件（置き換える）`() {
        val owned = OwnedCharacter(player, CharacterId("zero"))

        repository.save(owned)
        repository.save(owned)

        assertEquals(listOf(owned), repository.listByPlayerId(player))
    }

    @Test
    fun `プレイヤーごとに分けて持つ`() {
        repository.save(OwnedCharacter(player, CharacterId("zero")))
        repository.save(OwnedCharacter(otherPlayer, CharacterId("a")))

        assertEquals(listOf(CharacterId("zero")), repository.listByPlayerId(player).map { it.characterId })
        assertNull(repository.findByPlayerIdAndCharacterId(player, CharacterId("a")))
    }
}
