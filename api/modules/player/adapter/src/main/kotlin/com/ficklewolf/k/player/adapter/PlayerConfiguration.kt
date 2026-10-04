package com.ficklewolf.k.player.adapter

import com.ficklewolf.k.player.adapter.persistence.InMemoryPlayerRepository
import com.ficklewolf.k.player.api.PlayerApi
import com.ficklewolf.k.player.application.PlayerRepository
import com.ficklewolf.k.player.application.PlayerService
import com.ficklewolf.k.shared.kernel.TransactionRunner
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import com.ficklewolf.k.player.application.playerApi as createPlayerApi
import com.ficklewolf.k.player.application.playerService as createPlayerService

@Configuration
class PlayerConfiguration {
    @Bean
    fun playerRepository(): PlayerRepository = InMemoryPlayerRepository()

    @Bean
    fun playerService(
        playerRepository: PlayerRepository,
        transactionRunner: TransactionRunner,
    ): PlayerService = createPlayerService(playerRepository, transactionRunner)

    @Bean
    fun playerApi(playerService: PlayerService): PlayerApi = createPlayerApi(playerService)
}
