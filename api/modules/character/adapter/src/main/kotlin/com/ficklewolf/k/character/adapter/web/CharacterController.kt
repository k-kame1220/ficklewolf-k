package com.ficklewolf.k.character.adapter.web

import com.ficklewolf.k.character.application.CharacterService
import com.ficklewolf.k.character.application.EnhanceCharacterResult
import com.ficklewolf.k.character.domain.CharacterStats
import com.ficklewolf.k.character.domain.OwnedCharacter
import com.ficklewolf.k.platform.web.CommonErrorCode
import com.ficklewolf.k.platform.web.problemResponse
import com.ficklewolf.k.platform.web.security.AuthenticatedPlayer
import com.ficklewolf.k.platform.web.security.CurrentPlayer
import com.ficklewolf.k.shared.kernel.CharacterId
import com.ficklewolf.k.shared.kernel.Stat
import com.ficklewolf.k.shared.kernel.Stats
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RestController

data class CharacterAssetsResponse(
    val main: String,
    val icon: String,
    val home: String,
)

data class StatBonusResponse(
    val item: Int,
    val duplicate: Int,
    val weather: Int,
)

data class StatBreakdownResponse(
    val base: Int,
    val bonus: StatBonusResponse,
    val total: Int,
)

data class CharacterStatsResponse(
    val hp: StatBreakdownResponse,
    val attack: StatBreakdownResponse,
    val defence: StatBreakdownResponse,
)

data class StatCountsResponse(
    val hp: Int,
    val attack: Int,
    val defence: Int,
)

data class MyCharacterResponse(
    val id: String,
    val name: String,
    val attribute: String,
    val description: String,
    val assets: CharacterAssetsResponse,
    val stats: CharacterStatsResponse,
    val itemUses: StatCountsResponse,
    val itemUseMax: StatCountsResponse,
)

data class MyCharacterListResponse(
    val characters: List<MyCharacterResponse>,
)

data class EnhanceRequest(
    val hp: Int,
    val attack: Int,
    val defence: Int,
)

@RestController
class CharacterController(
    private val characterService: CharacterService,
) {
    @GetMapping("/me/characters")
    fun listMyCharacters(
        @CurrentPlayer player: AuthenticatedPlayer,
    ): ResponseEntity<MyCharacterListResponse> {
        val characters = characterService.listOwnedCharacters(player.playerId)
        return ResponseEntity.ok(MyCharacterListResponse(characters.map { it.toResponse() }))
    }

    @PostMapping("/me/characters/{characterId}/enhance")
    fun enhanceMyCharacter(
        @CurrentPlayer player: AuthenticatedPlayer,
        @PathVariable characterId: String,
        @RequestBody request: EnhanceRequest,
    ): ResponseEntity<*> {
        val items = Stats(request.hp, request.attack, request.defence)
        if (items == Stats.ZERO || Stat.entries.any { items[it] < 0 }) {
            return problemResponse(HttpStatus.BAD_REQUEST, CommonErrorCode.VALIDATION_FAILED, "request body is invalid")
        }

        return when (val result = characterService.enhanceCharacter(player.playerId, CharacterId(characterId), items)) {
            is EnhanceCharacterResult.Enhanced -> {
                ResponseEntity.ok(result.ownedCharacter.toResponse())
            }

            EnhanceCharacterResult.CharacterNotOwned -> {
                problemResponse(HttpStatus.NOT_FOUND, "CHARACTER_NOT_OWNED", "character is not owned")
            }

            EnhanceCharacterResult.ItemNotEnough -> {
                problemResponse(HttpStatus.CONFLICT, "ITEM_NOT_ENOUGH", "items are not enough")
            }

            EnhanceCharacterResult.EnhanceLimitExceeded -> {
                problemResponse(HttpStatus.CONFLICT, "ENHANCE_LIMIT_EXCEEDED", "item use limit exceeded")
            }
        }
    }
}

private fun OwnedCharacter.toResponse(): MyCharacterResponse =
    MyCharacterResponse(
        id = id.value,
        name = name,
        attribute = attribute.value,
        description = description,
        assets = CharacterAssetsResponse(assets.main, assets.icon, assets.home),
        stats =
            CharacterStatsResponse(
                hp = stats.toResponse(Stat.HP),
                attack = stats.toResponse(Stat.ATTACK),
                defence = stats.toResponse(Stat.DEFENCE),
            ),
        itemUses = itemUses.toResponse(),
        itemUseMax = itemUseMax.toResponse(),
    )

private fun CharacterStats.toResponse(stat: Stat): StatBreakdownResponse =
    StatBreakdownResponse(
        base = base[stat],
        bonus = StatBonusResponse(item[stat], duplicate[stat], weather[stat]),
        total = total[stat],
    )

private fun Stats.toResponse(): StatCountsResponse = StatCountsResponse(hp, attack, defence)
