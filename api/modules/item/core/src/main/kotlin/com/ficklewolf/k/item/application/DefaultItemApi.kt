package com.ficklewolf.k.item.application

import com.ficklewolf.k.item.api.ConsumeResult
import com.ficklewolf.k.item.api.ItemApi
import com.ficklewolf.k.shared.kernel.Attribute
import com.ficklewolf.k.shared.kernel.PlayerId
import com.ficklewolf.k.shared.kernel.Stats

fun itemApi(itemService: ItemService): ItemApi = DefaultItemApi(itemService)

internal class DefaultItemApi(
    private val itemService: ItemService,
) : ItemApi {
    override fun consume(
        playerId: PlayerId,
        attribute: Attribute,
        counts: Stats,
    ): ConsumeResult =
        if (itemService.consumeItemsByAttribute(playerId, attribute, counts) != null) {
            ConsumeResult.Consumed
        } else {
            ConsumeResult.ItemNotEnough
        }

    override fun acquireStarter(playerId: PlayerId) = itemService.acquireStarterItems(playerId)
}
