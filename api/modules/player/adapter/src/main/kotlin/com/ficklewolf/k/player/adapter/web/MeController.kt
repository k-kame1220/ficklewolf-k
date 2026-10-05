package com.ficklewolf.k.player.adapter.web

import com.ficklewolf.k.platform.web.CommonErrorCode
import com.ficklewolf.k.platform.web.problemResponse
import com.ficklewolf.k.platform.web.security.AuthenticatedPlayer
import com.ficklewolf.k.platform.web.security.CurrentPlayer
import com.ficklewolf.k.player.application.PlayerService
import com.ficklewolf.k.player.domain.Player
import com.ficklewolf.k.player.domain.PlayerName
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
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
)

@RestController
@RequestMapping("/me")
class MeController(
    private val playerService: PlayerService,
) {
    @GetMapping
    fun getMe(
        @CurrentPlayer player: AuthenticatedPlayer,
    ): ResponseEntity<*> {
        val me =
            playerService.find(player.playerId)
                ?: return problemResponse(HttpStatus.UNAUTHORIZED, CommonErrorCode.UNAUTHORIZED, "player not found")
        return ResponseEntity.ok(me.toResponse())
    }

    @PatchMapping
    fun updateMe(
        @CurrentPlayer player: AuthenticatedPlayer,
        @RequestBody request: UpdateMeRequest,
    ): ResponseEntity<*> {
        val rawName =
            request.name
                ?: return problemResponse(
                    HttpStatus.BAD_REQUEST,
                    CommonErrorCode.VALIDATION_FAILED,
                    "nothing to update",
                )
        val name =
            PlayerName.of(rawName)
                ?: return problemResponse(HttpStatus.BAD_REQUEST, "INVALID_NAME", "name must be 1 to 6 characters")
        val updated =
            playerService.rename(player.playerId, name)
                ?: return problemResponse(HttpStatus.UNAUTHORIZED, CommonErrorCode.UNAUTHORIZED, "player not found")
        return ResponseEntity.ok(updated.toResponse())
    }
}

private fun Player.toResponse(): MeResponse =
    MeResponse(id.value.toString(), name.value, level, fuda, selectedCharacterId)
