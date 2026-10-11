package com.ficklewolf.k.character.application

import com.ficklewolf.k.character.domain.Character
import com.ficklewolf.k.shared.kernel.CharacterId

interface CharacterRepository {
    fun findById(id: CharacterId): Character?

    fun listAll(): List<Character>

    fun listByIds(ids: Collection<CharacterId>): List<Character>
}
