package com.ficklewolf.k.auth.application

import com.ficklewolf.k.auth.domain.AuthToken
import com.ficklewolf.k.auth.domain.TokenHash
import com.ficklewolf.k.player.api.CreatePlayerResult
import com.ficklewolf.k.player.api.PlayerApi
import com.ficklewolf.k.player.api.PlayerSummary
import com.ficklewolf.k.shared.kernel.PlayerId
import com.ficklewolf.k.shared.kernel.TransactionRunner
import java.time.Clock

sealed interface RegisterGuestResult {
    data class Registered(
        val token: String,
        val player: PlayerSummary,
    ) : RegisterGuestResult

    data object InvalidName : RegisterGuestResult
}

interface AuthService {
    fun registerGuest(name: String): RegisterGuestResult

    fun authenticate(rawToken: String): PlayerId?
}

fun authService(
    playerApi: PlayerApi,
    tokenRepository: AuthTokenRepository,
    tokenGenerator: TokenGenerator,
    transaction: TransactionRunner,
    clock: Clock,
): AuthService = DefaultAuthService(playerApi, tokenRepository, tokenGenerator, transaction, clock)

internal class DefaultAuthService(
    private val playerApi: PlayerApi,
    private val tokenRepository: AuthTokenRepository,
    private val tokenGenerator: TokenGenerator,
    private val transaction: TransactionRunner,
    private val clock: Clock,
) : AuthService {
    override fun registerGuest(name: String): RegisterGuestResult =
        transaction.run {
            when (val created = playerApi.createPlayer(name)) {
                CreatePlayerResult.InvalidName -> {
                    RegisterGuestResult.InvalidName
                }

                is CreatePlayerResult.Created -> {
                    val rawToken = tokenGenerator.generate()
                    tokenRepository.save(AuthToken(TokenHash.of(rawToken), created.player.id, clock.instant()))
                    RegisterGuestResult.Registered(rawToken, created.player)
                }
            }
        }

    override fun authenticate(rawToken: String): PlayerId? =
        tokenRepository.findByHash(TokenHash.of(rawToken))?.playerId
}
