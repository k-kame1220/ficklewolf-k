package com.ficklewolf.k.auth.adapter.web

import com.ficklewolf.k.auth.application.AuthService
import com.ficklewolf.k.auth.application.RegisterGuestResult
import com.ficklewolf.k.platform.web.problemResponse
import com.ficklewolf.k.player.api.PlayerSummary
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

data class CreateGuestRequest(
    val name: String,
)

data class MeResponse(
    val id: String,
    val name: String,
    val level: Int,
    val fuda: Int,
    val selectedCharacterId: String,
)

data class CreateGuestResponse(
    val token: String,
    val me: MeResponse,
)

@RestController
@RequestMapping("/auth")
class AuthController(
    private val authService: AuthService,
) {
    @PostMapping("/guest")
    fun createGuest(
        @RequestBody request: CreateGuestRequest,
    ): ResponseEntity<*> =
        when (val result = authService.registerGuest(request.name)) {
            is RegisterGuestResult.Registered -> {
                ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(CreateGuestResponse(result.token, result.player.toResponse()))
            }

            RegisterGuestResult.InvalidName -> {
                problemResponse(HttpStatus.BAD_REQUEST, "INVALID_NAME", "name must be 1 to 6 characters")
            }
        }
}

private fun PlayerSummary.toResponse(): MeResponse =
    MeResponse(id.value.toString(), name, level, fuda, selectedCharacterId)
