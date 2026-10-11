package com.ficklewolf.k.character.application

import com.ficklewolf.k.character.domain.CharacterConfig

interface CharacterConfigRepository {
    fun load(): CharacterConfig
}
