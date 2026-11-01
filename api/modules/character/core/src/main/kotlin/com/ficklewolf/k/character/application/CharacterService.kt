package com.ficklewolf.k.character.application

import com.ficklewolf.k.character.domain.Character
import com.ficklewolf.k.character.domain.CharacterInventory
import com.ficklewolf.k.character.domain.OwnedCharacter
import com.ficklewolf.k.item.api.ConsumeResult
import com.ficklewolf.k.item.api.ItemApi
import com.ficklewolf.k.shared.kernel.CharacterId
import com.ficklewolf.k.shared.kernel.PlayerId
import com.ficklewolf.k.shared.kernel.Stats
import com.ficklewolf.k.shared.kernel.TransactionRunner
import com.ficklewolf.k.weather.api.WeatherApi

sealed interface EnhanceCharacterResult {
    data class Enhanced(
        val ownedCharacter: OwnedCharacter,
    ) : EnhanceCharacterResult

    data object CharacterNotOwned : EnhanceCharacterResult

    data object ItemNotEnough : EnhanceCharacterResult

    data object EnhanceLimitExceeded : EnhanceCharacterResult
}

interface CharacterService {
    fun findCharacter(id: CharacterId): Character?

    fun listOwnedCharacters(playerId: PlayerId): List<OwnedCharacter>

    fun ownsCharacter(
        playerId: PlayerId,
        characterId: CharacterId,
    ): Boolean

    fun acquireCharacter(
        playerId: PlayerId,
        characterId: CharacterId,
    ): Character?

    fun enhanceCharacter(
        playerId: PlayerId,
        characterId: CharacterId,
        items: Stats,
    ): EnhanceCharacterResult

    fun getStarterCharacter(): Character
}

fun characterService(
    itemApi: ItemApi,
    weatherApi: WeatherApi,
    characterRepository: CharacterRepository,
    characterInventoryRepository: CharacterInventoryRepository,
    characterConfigRepository: CharacterConfigRepository,
    transaction: TransactionRunner,
): CharacterService =
    DefaultCharacterService(
        itemApi,
        weatherApi,
        characterRepository,
        characterInventoryRepository,
        characterConfigRepository,
        transaction,
    )

internal class DefaultCharacterService(
    private val itemApi: ItemApi,
    private val weatherApi: WeatherApi,
    private val characterRepository: CharacterRepository,
    private val characterInventoryRepository: CharacterInventoryRepository,
    private val characterConfigRepository: CharacterConfigRepository,
    private val transaction: TransactionRunner,
) : CharacterService {
    override fun findCharacter(id: CharacterId): Character? = characterRepository.findById(id)

    override fun listOwnedCharacters(playerId: PlayerId): List<OwnedCharacter> {
        val inventory = findInventory(playerId)
        val characters = characterRepository.listByIds(inventory.investments.keys).sortedBy { it.no }
        val config = characterConfigRepository.load()
        val todayWeather = weatherApi.getToday()
        return characters.map { character ->
            OwnedCharacter.of(
                character = character,
                investment = inventory[character.id],
                config = config,
                weatherBonus = todayWeather.bonusFor(character.attribute),
            )
        }
    }

    override fun ownsCharacter(
        playerId: PlayerId,
        characterId: CharacterId,
    ): Boolean = findInventory(playerId).owns(characterId)

    override fun acquireCharacter(
        playerId: PlayerId,
        characterId: CharacterId,
    ): Character? =
        transaction.run {
            val character = characterRepository.findById(characterId) ?: return@run null
            characterInventoryRepository.save(findInventory(playerId).acquire(characterId))
            character
        }

    override fun enhanceCharacter(
        playerId: PlayerId,
        characterId: CharacterId,
        items: Stats,
    ): EnhanceCharacterResult =
        transaction.run {
            val character =
                characterRepository.findById(characterId) ?: return@run EnhanceCharacterResult.CharacterNotOwned
            val inventory = findInventory(playerId)
            if (!inventory.owns(characterId)) return@run EnhanceCharacterResult.CharacterNotOwned

            val config = characterConfigRepository.load()
            val next =
                inventory.enhance(characterId, items, config.itemUseMax)
                    ?: return@run EnhanceCharacterResult.EnhanceLimitExceeded

            when (itemApi.consume(playerId, character.attribute, items)) {
                ConsumeResult.Consumed -> {
                    characterInventoryRepository.save(next)
                    EnhanceCharacterResult.Enhanced(
                        OwnedCharacter.of(
                            character = character,
                            investment = next[characterId],
                            config = config,
                            weatherBonus = weatherApi.getToday().bonusFor(character.attribute),
                        ),
                    )
                }

                ConsumeResult.ItemNotEnough -> {
                    EnhanceCharacterResult.ItemNotEnough
                }
            }
        }

    override fun getStarterCharacter(): Character =
        characterConfigRepository.load().starterCharacterId.let {
            characterRepository.findById(it) ?: error("starter character not found: ${it.value}")
        }

    private fun findInventory(playerId: PlayerId): CharacterInventory =
        characterInventoryRepository.findByPlayerId(playerId) ?: CharacterInventory.empty(playerId)
}
