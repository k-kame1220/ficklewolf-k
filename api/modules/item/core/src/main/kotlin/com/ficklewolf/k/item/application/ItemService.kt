package com.ficklewolf.k.item.application

import com.ficklewolf.k.item.domain.ItemCount
import com.ficklewolf.k.item.domain.ItemInventory
import com.ficklewolf.k.item.domain.ItemStack
import com.ficklewolf.k.item.domain.OwnedItem
import com.ficklewolf.k.shared.kernel.Attribute
import com.ficklewolf.k.shared.kernel.PlayerId
import com.ficklewolf.k.shared.kernel.Stats
import com.ficklewolf.k.shared.kernel.TransactionRunner

interface ItemService {
    fun listOwnedItems(playerId: PlayerId): List<OwnedItem>

    fun acquireItems(
        playerId: PlayerId,
        stacks: List<ItemStack>,
    )

    fun consumeItemsByAttribute(
        playerId: PlayerId,
        attribute: Attribute,
        counts: Stats,
    ): ItemInventory?

    fun acquireStarterItems(playerId: PlayerId)
}

fun itemService(
    itemRepository: ItemRepository,
    itemInventoryRepository: ItemInventoryRepository,
    itemConfigRepository: ItemConfigRepository,
    transaction: TransactionRunner,
): ItemService = DefaultItemService(itemRepository, itemInventoryRepository, itemConfigRepository, transaction)

internal class DefaultItemService(
    private val itemRepository: ItemRepository,
    private val itemInventoryRepository: ItemInventoryRepository,
    private val itemConfigRepository: ItemConfigRepository,
    private val transaction: TransactionRunner,
) : ItemService {
    override fun listOwnedItems(playerId: PlayerId): List<OwnedItem> {
        val inventory = findInventory(playerId)
        return itemRepository
            .listAll()
            .map { OwnedItem(it, inventory[it.id]) }
            .filter { it.count > ItemCount.ZERO }
    }

    override fun acquireItems(
        playerId: PlayerId,
        stacks: List<ItemStack>,
    ) = transaction.run {
        stacks.forEach { checkNotNull(itemRepository.findById(it.itemId)) { "unknown item: ${it.itemId.value}" } }
        itemInventoryRepository.save(findInventory(playerId).add(stacks))
    }

    override fun consumeItemsByAttribute(
        playerId: PlayerId,
        attribute: Attribute,
        counts: Stats,
    ): ItemInventory? =
        transaction.run {
            val stacks =
                itemRepository.listByAttribute(attribute).map { item ->
                    val count = ItemCount.of(counts[item.stat]) ?: error("negative count: ${counts[item.stat]}")
                    ItemStack(item.id, count)
                }
            findInventory(playerId).remove(stacks)?.also { itemInventoryRepository.save(it) }
        }

    override fun acquireStarterItems(playerId: PlayerId) =
        acquireItems(playerId, itemConfigRepository.load().starterItems)

    private fun findInventory(playerId: PlayerId): ItemInventory =
        itemInventoryRepository.findByPlayerId(playerId) ?: ItemInventory.empty(playerId)
}
