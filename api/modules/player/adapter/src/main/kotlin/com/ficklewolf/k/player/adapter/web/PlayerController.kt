package com.ficklewolf.k.player.adapter.web

import com.ficklewolf.k.platform.web.CommonErrorCode
import com.ficklewolf.k.platform.web.problemResponse
import com.ficklewolf.k.platform.web.security.AuthenticatedPlayer
import com.ficklewolf.k.platform.web.security.CurrentPlayer
import com.ficklewolf.k.player.application.PlayerService
import com.ficklewolf.k.player.application.UpdatePlayerResult
import com.ficklewolf.k.player.domain.Player
import com.ficklewolf.k.player.domain.PlayerName
import com.ficklewolf.k.shared.kernel.CharacterId
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RestController

data class MeResponse(
    val id: String,
    val name: String,
    val level: Int,
    val fuda: Int,
    val selectedCharacterId: String,
)

data class UpdateMeRequest(
    val name: String?,
    val selectedCharacterId: String?,
)

@RestController
class PlayerController(
    private val playerService: PlayerService,
) {
    @GetMapping("/me")
    fun getMe(
        @CurrentPlayer player: AuthenticatedPlayer,
    ): ResponseEntity<*> {
        val me =
            playerService.findPlayer(player.playerId)
                ?: return problemResponse(HttpStatus.UNAUTHORIZED, CommonErrorCode.UNAUTHORIZED, "player not found")
        return ResponseEntity.ok(me.toResponse())
    }

    @PatchMapping("/me")
    fun updateMe(
        @CurrentPlayer player: AuthenticatedPlayer,
        @RequestBody request: UpdateMeRequest,
    ): ResponseEntity<*> {
        if (request.name == null && request.selectedCharacterId == null) {
            return problemResponse(HttpStatus.BAD_REQUEST, CommonErrorCode.VALIDATION_FAILED, "nothing to update")
        }
        val name =
            request.name?.let {
                PlayerName.of(it)
                    ?: return problemResponse(HttpStatus.BAD_REQUEST, "INVALID_NAME", "name must be 1 to 6 characters")
            }
        return when (
            val result =
                playerService.updatePlayer(
                    player.playerId,
                    name,
                    request.selectedCharacterId?.let(::CharacterId),
                )
        ) {
            is UpdatePlayerResult.Updated -> {
                ResponseEntity.ok(result.player.toResponse())
            }

            UpdatePlayerResult.PlayerNotFound -> {
                problemResponse(
                    HttpStatus.UNAUTHORIZED,
                    CommonErrorCode.UNAUTHORIZED,
                    "player not found",
                )
            }

            UpdatePlayerResult.CharacterNotOwned -> {
                problemResponse(
                    HttpStatus.BAD_REQUEST,
                    "CHARACTER_NOT_OWNED",
                    "character is not owned",
                )
            }
        }
    }
}

private fun Player.toResponse(): MeResponse =
    MeResponse(id.value.toString(), name.value, level, fuda, selectedCharacterId.value)
