package com.ficklewolf.k.character.adapter

import com.ficklewolf.k.character.adapter.persistence.ClasspathCharacterConfigRepository
import com.ficklewolf.k.character.adapter.persistence.ClasspathCharacterRepository
import com.ficklewolf.k.character.adapter.persistence.InMemoryOwnedCharacterRepository
import com.ficklewolf.k.character.api.CharacterApi
import com.ficklewolf.k.character.application.CharacterConfigRepository
import com.ficklewolf.k.character.application.CharacterRepository
import com.ficklewolf.k.character.application.CharacterService
import com.ficklewolf.k.character.application.OwnedCharacterRepository
import com.ficklewolf.k.shared.kernel.TransactionRunner
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import tools.jackson.databind.json.JsonMapper
import com.ficklewolf.k.character.application.characterApi as createCharacterApi
import com.ficklewolf.k.character.application.characterService as createCharacterService

@Configuration
class CharacterConfiguration {
    @Bean
    fun characterRepository(jsonMapper: JsonMapper): CharacterRepository = ClasspathCharacterRepository(jsonMapper)

    @Bean
    fun ownedCharacterRepository(): OwnedCharacterRepository = InMemoryOwnedCharacterRepository()

    @Bean
    fun characterConfigRepository(jsonMapper: JsonMapper): CharacterConfigRepository =
        ClasspathCharacterConfigRepository(jsonMapper)

    @Bean
    fun characterService(
        characterRepository: CharacterRepository,
        ownedCharacterRepository: OwnedCharacterRepository,
        characterConfigRepository: CharacterConfigRepository,
        transactionRunner: TransactionRunner,
    ): CharacterService =
        createCharacterService(
            characterRepository,
            ownedCharacterRepository,
            characterConfigRepository,
            transactionRunner,
        )

    @Bean
    fun characterApi(characterService: CharacterService): CharacterApi = createCharacterApi(characterService)
}
