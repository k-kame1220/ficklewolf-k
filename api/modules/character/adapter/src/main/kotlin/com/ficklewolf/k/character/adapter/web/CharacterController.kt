package com.ficklewolf.k.character.adapter.web

import com.ficklewolf.k.character.application.CharacterService
import com.ficklewolf.k.character.domain.Character
import com.ficklewolf.k.platform.web.security.AuthenticatedPlayer
import com.ficklewolf.k.platform.web.security.CurrentPlayer
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

data class CharacterAssetsResponse(
    val main: String,
    val icon: String,
    val home: String,
)

data class MyCharacterResponse(
    val id: String,
    val name: String,
    val attribute: String,
    val description: String,
    val assets: CharacterAssetsResponse,
)

data class MyCharacterListResponse(
    val characters: List<MyCharacterResponse>,
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
}

private fun Character.toResponse(): MyCharacterResponse =
    MyCharacterResponse(
        id.value,
        name,
        attribute.value,
        description,
        CharacterAssetsResponse(assets.main, assets.icon, assets.home),
    )
