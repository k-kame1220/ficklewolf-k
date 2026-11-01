package com.ficklewolf.k.item.adapter.persistence

import com.ficklewolf.k.item.application.ItemConfigRepository
import com.ficklewolf.k.item.domain.ItemConfig
import com.ficklewolf.k.item.domain.ItemCount
import com.ficklewolf.k.item.domain.ItemStack
import com.ficklewolf.k.shared.kernel.ItemId
import org.springframework.core.io.ClassPathResource
import tools.jackson.databind.JsonNode
import tools.jackson.databind.json.JsonMapper

class ClasspathItemConfigRepository(
    jsonMapper: JsonMapper,
) : ItemConfigRepository {
    private val config: ItemConfig =
        jsonMapper
            .readTree(ClassPathResource(MASTER_PATH).contentAsByteArray)
            .toItemConfig()

    override fun load(): ItemConfig = config

    private companion object {
        const val MASTER_PATH = "item/settings.json"
    }
}

private fun JsonNode.toItemConfig(): ItemConfig =
    required("starterItems")
        .asArray()
        .values()
        .map {
            val rawItemId = it.required("itemId").stringValue()
            val rawCount = it.required("count").intValue()
            ItemStack(
                ItemId(rawItemId),
                ItemCount.of(rawCount) ?: error("Invalid item count id:$rawItemId count:$rawCount"),
            )
        }.let { ItemConfig(it) }
