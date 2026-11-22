package com.ficklewolf.k.quest.application

import com.ficklewolf.k.player.api.PlayerApi
import com.ficklewolf.k.quest.domain.AvailableQuest
import com.ficklewolf.k.quest.domain.QuestClear
import com.ficklewolf.k.quest.domain.QuestKind
import com.ficklewolf.k.shared.kernel.PlayerId
import com.ficklewolf.k.shared.kernel.QuestId
import com.ficklewolf.k.shared.kernel.TransactionRunner
import com.ficklewolf.k.weather.api.WeatherApi
import java.time.Clock

interface QuestService {
    fun listAvailableQuests(playerId: PlayerId): List<AvailableQuest>

    fun clearQuest(
        playerId: PlayerId,
        questId: QuestId,
    ): QuestClear
}

fun questService(
    playerApi: PlayerApi,
    weatherApi: WeatherApi,
    questRepository: QuestRepository,
    questClearRepository: QuestClearRepository,
    questConfigRepository: QuestConfigRepository,
    transaction: TransactionRunner,
    clock: Clock,
): QuestService =
    DefaultQuestService(
        playerApi,
        weatherApi,
        questRepository,
        questClearRepository,
        questConfigRepository,
        transaction,
        clock,
    )

internal class DefaultQuestService(
    private val playerApi: PlayerApi,
    private val weatherApi: WeatherApi,
    private val questRepository: QuestRepository,
    private val questClearRepository: QuestClearRepository,
    private val questConfigRepository: QuestConfigRepository,
    private val transaction: TransactionRunner,
    private val clock: Clock,
) : QuestService {
    override fun listAvailableQuests(playerId: PlayerId): List<AvailableQuest> {
        val level = playerApi.find(playerId)?.level ?: error("player not found: ${playerId.value}")
        val todayWeatherId = weatherApi.getToday().id
        val quests = questRepository.listAll()
        val clears = questClearRepository.listByPlayerId(playerId).map { it.questId }.toSet()
        val mains = quests.filter { it.kind == QuestKind.Main && it.order <= level }.sortedBy { it.order }
        val weathers =
            quests.filter {
                val kind = it.kind
                kind is QuestKind.Weather && kind.weatherId == todayWeatherId
            }
        return (mains + weathers).map { AvailableQuest(it, isCleared = clears.contains(it.id)) }
    }

    override fun clearQuest(
        playerId: PlayerId,
        questId: QuestId,
    ): QuestClear =
        transaction.run {
            val quest =
                questRepository.listAll().find { it.id == questId } ?: error(
                    "quest not found: ${questId.value}",
                )
            val cleared =
                questClearRepository.findByPlayerIdAndQuestId(playerId, questId)?.recordClear()
                    ?: QuestClear.first(playerId, questId, clock.instant())
            questClearRepository.save(cleared)

            if (quest.kind == QuestKind.Main && cleared.isFirstClear) {
                val leveledUp = playerApi.levelUp(playerId)
                val isEvenLevel = leveledUp.level % 2 == 0
                if (isEvenLevel) playerApi.addFuda(playerId, questConfigRepository.load().fudaPerEvenLevel)
            }
            cleared
        }
}
