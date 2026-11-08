package com.ficklewolf.k.quest.adapter

import com.ficklewolf.k.player.api.PlayerApi
import com.ficklewolf.k.quest.adapter.persistence.ClasspathQuestRepository
import com.ficklewolf.k.quest.application.QuestRepository
import com.ficklewolf.k.quest.application.QuestService
import com.ficklewolf.k.weather.api.WeatherApi
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import tools.jackson.databind.json.JsonMapper
import com.ficklewolf.k.quest.application.questService as createQuestService

@Configuration
class QuestConfiguration {
    @Bean
    fun questRepository(jsonMapper: JsonMapper): QuestRepository = ClasspathQuestRepository(jsonMapper)

    @Bean
    fun questService(
        playerApi: PlayerApi,
        weatherApi: WeatherApi,
        questRepository: QuestRepository,
    ): QuestService = createQuestService(playerApi, weatherApi, questRepository)
}
