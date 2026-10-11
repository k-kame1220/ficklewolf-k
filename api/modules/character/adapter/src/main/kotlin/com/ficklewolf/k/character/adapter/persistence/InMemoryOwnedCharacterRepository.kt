package com.ficklewolf.k.character.adapter.persistence

import com.ficklewolf.k.character.application.OwnedCharacterRepository
import com.ficklewolf.k.character.domain.OwnedCharacter
import com.ficklewolf.k.shared.kernel.CharacterId
import com.ficklewolf.k.shared.kernel.PlayerId
import java.util.concurrent.ConcurrentHashMap

class InMemoryOwnedCharacterRepository : OwnedCharacterRepository {
    private val ownedCharacters = ConcurrentHashMap<PlayerId, Map<CharacterId, OwnedCharacter>>()

    override fun listByPlayerId(playerId: PlayerId): List<OwnedCharacter> =
        ownedCharacters[playerId].orEmpty().values.toList()

    override fun findByPlayerIdAndCharacterId(
        playerId: PlayerId,
        characterId: CharacterId,
    ): OwnedCharacter? = ownedCharacters[playerId]?.get(characterId)

    override fun save(ownedCharacter: OwnedCharacter) {
        ownedCharacters.merge(
            ownedCharacter.playerId,
            mapOf(ownedCharacter.characterId to ownedCharacter),
        ) { owned, saved -> owned + saved }
    }
}
