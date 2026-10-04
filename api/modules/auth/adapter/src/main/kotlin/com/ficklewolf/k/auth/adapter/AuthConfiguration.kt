package com.ficklewolf.k.auth.adapter

import com.ficklewolf.k.auth.adapter.persistence.InMemoryAuthTokenRepository
import com.ficklewolf.k.auth.adapter.security.SecureRandomTokenGenerator
import com.ficklewolf.k.auth.application.AuthService
import com.ficklewolf.k.auth.application.AuthTokenRepository
import com.ficklewolf.k.auth.application.TokenGenerator
import com.ficklewolf.k.platform.web.security.PublicEndpoint
import com.ficklewolf.k.platform.web.security.TokenAuthenticator
import com.ficklewolf.k.player.api.PlayerApi
import com.ficklewolf.k.shared.kernel.TransactionRunner
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpMethod
import java.time.Clock
import com.ficklewolf.k.auth.application.authService as createAuthService

@Configuration
class AuthConfiguration {
    @Bean
    fun authTokenRepository(): AuthTokenRepository = InMemoryAuthTokenRepository()

    @Bean
    fun tokenGenerator(): TokenGenerator = SecureRandomTokenGenerator()

    @Bean
    fun authService(
        playerApi: PlayerApi,
        authTokenRepository: AuthTokenRepository,
        tokenGenerator: TokenGenerator,
        transactionRunner: TransactionRunner,
    ): AuthService =
        createAuthService(playerApi, authTokenRepository, tokenGenerator, transactionRunner, Clock.systemUTC())

    // …今ある 3 つの @Bean はそのまま…

    @Bean
    fun tokenAuthenticator(authService: AuthService): TokenAuthenticator =
        TokenAuthenticator { token -> authService.authenticate(token) }

    @Bean
    fun createGuestEndpoint(): PublicEndpoint = PublicEndpoint(HttpMethod.POST, "/auth/guest")
}
