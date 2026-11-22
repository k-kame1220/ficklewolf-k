package com.ficklewolf.k.quest.adapter

import com.ficklewolf.k.player.api.PlayerApi
import com.ficklewolf.k.quest.adapter.persistence.ClasspathQuestRepository
import com.ficklewolf.k.quest.adapter.persistence.InMemoryQuestClearRepository
import com.ficklewolf.k.quest.api.QuestApi
import com.ficklewolf.k.quest.application.QuestClearRepository
import com.ficklewolf.k.quest.application.QuestRepository
import com.ficklewolf.k.quest.application.QuestService
import com.ficklewolf.k.shared.kernel.TransactionRunner
import com.ficklewolf.k.weather.api.WeatherApi
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import tools.jackson.databind.json.JsonMapper
import java.time.Clock
import com.ficklewolf.k.quest.application.questApi as createQuestApi
import com.ficklewolf.k.quest.application.questService as createQuestService

@Configuration
class QuestConfiguration {
    @Bean
    fun questRepository(jsonMapper: JsonMapper): QuestRepository = ClasspathQuestRepository(jsonMapper)

    @Bean
    fun questClearRepository(): QuestClearRepository = InMemoryQuestClearRepository()

    @Bean
    fun questService(
        playerApi: PlayerApi,
        weatherApi: WeatherApi,
        questRepository: QuestRepository,
        questClearRepository: QuestClearRepository,
        transaction: TransactionRunner,
    ): QuestService =
        createQuestService(
            playerApi,
            weatherApi,
            questRepository,
            questClearRepository,
            transaction,
            Clock.systemUTC(),
        )

    @Bean
    fun questApi(questService: QuestService): QuestApi = createQuestApi(questService)
}
