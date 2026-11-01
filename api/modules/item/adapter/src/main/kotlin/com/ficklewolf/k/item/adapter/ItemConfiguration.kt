package com.ficklewolf.k.item.adapter

import com.ficklewolf.k.item.adapter.persistence.ClasspathItemConfigRepository
import com.ficklewolf.k.item.adapter.persistence.ClasspathItemRepository
import com.ficklewolf.k.item.adapter.persistence.InMemoryItemInventoryRepository
import com.ficklewolf.k.item.api.ItemApi
import com.ficklewolf.k.item.application.ItemConfigRepository
import com.ficklewolf.k.item.application.ItemInventoryRepository
import com.ficklewolf.k.item.application.ItemRepository
import com.ficklewolf.k.item.application.ItemService
import com.ficklewolf.k.shared.kernel.TransactionRunner
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import tools.jackson.databind.json.JsonMapper
import com.ficklewolf.k.item.application.itemApi as createItemApi
import com.ficklewolf.k.item.application.itemService as createItemService

@Configuration
class ItemConfiguration {
    @Bean
    fun itemRepository(jsonMapper: JsonMapper): ItemRepository = ClasspathItemRepository(jsonMapper)

    @Bean
    fun itemInventoryRepository(): ItemInventoryRepository = InMemoryItemInventoryRepository()

    @Bean
    fun itemConfigRepository(jsonMapper: JsonMapper): ItemConfigRepository = ClasspathItemConfigRepository(jsonMapper)

    @Bean
    fun itemService(
        itemRepository: ItemRepository,
        itemInventoryRepository: ItemInventoryRepository,
        itemConfigRepository: ItemConfigRepository,
        transaction: TransactionRunner,
    ): ItemService = createItemService(itemRepository, itemInventoryRepository, itemConfigRepository, transaction)

    @Bean
    fun itemApi(itemService: ItemService): ItemApi = createItemApi(itemService)
}
