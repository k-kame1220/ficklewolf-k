package com.ficklewolf.k.character.api

sealed interface AcquireCharacterResult {
    data class Acquired(
        val character: CharacterSummary,
    ) : AcquireCharacterResult

    data object CharacterNotFound : AcquireCharacterResult
}
