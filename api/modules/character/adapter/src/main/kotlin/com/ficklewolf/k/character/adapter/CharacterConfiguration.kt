package com.ficklewolf.k.character.adapter

import com.ficklewolf.k.character.adapter.persistence.ClasspathCharacterConfigRepository
import com.ficklewolf.k.character.adapter.persistence.ClasspathCharacterRepository
import com.ficklewolf.k.character.adapter.persistence.InMemoryCharacterInventoryRepository
import com.ficklewolf.k.character.api.CharacterApi
import com.ficklewolf.k.character.application.CharacterConfigRepository
import com.ficklewolf.k.character.application.CharacterInventoryRepository
import com.ficklewolf.k.character.application.CharacterRepository
import com.ficklewolf.k.character.application.CharacterService
import com.ficklewolf.k.item.api.ItemApi
import com.ficklewolf.k.shared.kernel.TransactionRunner
import com.ficklewolf.k.weather.api.WeatherApi
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
    fun characterInventoryRepository(): CharacterInventoryRepository = InMemoryCharacterInventoryRepository()

    @Bean
    fun characterConfigRepository(jsonMapper: JsonMapper): CharacterConfigRepository =
        ClasspathCharacterConfigRepository(jsonMapper)

    @Bean
    fun characterService(
        itemApi: ItemApi,
        weatherApi: WeatherApi,
        characterRepository: CharacterRepository,
        characterInventoryRepository: CharacterInventoryRepository,
        characterConfigRepository: CharacterConfigRepository,
        transactionRunner: TransactionRunner,
    ): CharacterService =
        createCharacterService(
            itemApi,
            weatherApi,
            characterRepository,
            characterInventoryRepository,
            characterConfigRepository,
            transactionRunner,
        )

    @Bean
    fun characterApi(characterService: CharacterService): CharacterApi = createCharacterApi(characterService)
}
