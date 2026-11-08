package com.ficklewolf.k.quest.application

import com.ficklewolf.k.player.api.PlayerApi
import com.ficklewolf.k.quest.domain.AvailableQuest
import com.ficklewolf.k.quest.domain.QuestKind
import com.ficklewolf.k.shared.kernel.PlayerId
import com.ficklewolf.k.weather.api.WeatherApi

interface QuestService {
    fun listAvailableQuests(playerId: PlayerId): List<AvailableQuest>
}

fun questService(
    playerApi: PlayerApi,
    weatherApi: WeatherApi,
    questRepository: QuestRepository,
): QuestService = DefaultQuestService(playerApi, weatherApi, questRepository)

internal class DefaultQuestService(
    private val playerApi: PlayerApi,
    private val weatherApi: WeatherApi,
    private val questRepository: QuestRepository,
) : QuestService {
    override fun listAvailableQuests(playerId: PlayerId): List<AvailableQuest> {
        val level = playerApi.find(playerId)?.level ?: error("player not found: ${playerId.value}")
        val todayWeatherId = weatherApi.getToday().id
        val quests = questRepository.listAll()
        val mains = quests.filter { it.kind == QuestKind.Main && it.order <= level }.sortedBy { it.order }
        val weathers =
            quests.filter {
                val kind = it.kind
                kind is QuestKind.Weather && kind.weatherId == todayWeatherId
            }
        return (mains + weathers).map { AvailableQuest(it, isCleared = false) }
    }
}
