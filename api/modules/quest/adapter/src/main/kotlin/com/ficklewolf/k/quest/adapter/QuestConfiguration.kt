package com.ficklewolf.k.quest.adapter

import com.ficklewolf.k.player.api.PlayerApi
import com.ficklewolf.k.quest.adapter.persistence.ClasspathQuestConfigRepository
import com.ficklewolf.k.quest.adapter.persistence.ClasspathQuestRepository
import com.ficklewolf.k.quest.adapter.persistence.InMemoryQuestClearRepository
import com.ficklewolf.k.quest.api.QuestApi
import com.ficklewolf.k.quest.application.QuestClearRepository
import com.ficklewolf.k.quest.application.QuestConfigRepository
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
    fun questConfigRepository(jsonMapper: JsonMapper): QuestConfigRepository =
        ClasspathQuestConfigRepository(jsonMapper)

    @Bean
    fun questService(
        playerApi: PlayerApi,
        weatherApi: WeatherApi,
        questRepository: QuestRepository,
        questClearRepository: QuestClearRepository,
        questConfigRepository: QuestConfigRepository,
        transaction: TransactionRunner,
    ): QuestService =
        createQuestService(
            playerApi,
            weatherApi,
            questRepository,
            questClearRepository,
            questConfigRepository,
            transaction,
            Clock.systemUTC(),
        )

    @Bean
    fun questApi(questService: QuestService): QuestApi = createQuestApi(questService)
}
