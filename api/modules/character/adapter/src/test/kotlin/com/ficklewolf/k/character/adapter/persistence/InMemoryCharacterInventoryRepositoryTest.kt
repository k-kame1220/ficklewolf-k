package com.ficklewolf.k.character.adapter.persistence

import com.ficklewolf.k.character.domain.CharacterInventory
import com.ficklewolf.k.shared.kernel.CharacterId
import com.ficklewolf.k.shared.kernel.PlayerId
import java.util.UUID
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull

class InMemoryCharacterInventoryRepositoryTest {
    private val repository = InMemoryCharacterInventoryRepository()

    private val player = PlayerId(UUID.randomUUID())
    private val otherPlayer = PlayerId(UUID.randomUUID())

    @Test
    fun `保存した持ち物をプレイヤーごとに取れる。まだないプレイヤーは null`() {
        val inventory = CharacterInventory.empty(player).acquire(CharacterId("zero"))

        repository.save(inventory)

        assertEquals(inventory, repository.findByPlayerId(player))
        assertNull(repository.findByPlayerId(otherPlayer))
    }

    @Test
    fun `同じプレイヤーの持ち物を保存し直すと置き換わる`() {
        val first = CharacterInventory.empty(player).acquire(CharacterId("zero"))
        val second = first.acquire(CharacterId("a"))

        repository.save(first)
        repository.save(second)

        assertEquals(second, repository.findByPlayerId(player))
    }
}
