package com.ficklewolf.k.item.adapter.persistence

import com.ficklewolf.k.item.application.ItemRepository
import com.ficklewolf.k.item.domain.Item
import com.ficklewolf.k.shared.kernel.Attribute
import com.ficklewolf.k.shared.kernel.ItemId
import com.ficklewolf.k.shared.kernel.Stat
import org.springframework.core.io.ClassPathResource
import tools.jackson.databind.JsonNode
import tools.jackson.databind.json.JsonMapper

class ClasspathItemRepository(
    jsonMapper: JsonMapper,
) : ItemRepository {
    private val masters: Map<ItemId, Item> =
        jsonMapper
            .readTree(
                ClassPathResource(MASTER_PATH).contentAsByteArray,
            ).asArray()
            .values()
            .map {
                it.toItem()
            }.associateBy { it.id }

    override fun findById(id: ItemId): Item? = masters[id]

    override fun listAll(): List<Item> = masters.values.toList()

    override fun listByAttribute(attribute: Attribute): List<Item> = masters.values.filter { it.attribute == attribute }

    private companion object {
        const val MASTER_PATH = "item/items.json"
    }
}

private fun JsonNode.toItem(): Item {
    val rawAttribute = required("attribute").stringValue()
    val rawStat = required("stat").stringValue()
    return Item(
        id = ItemId(required("id").stringValue()),
        name = required("name").stringValue(),
        attribute = Attribute.of(rawAttribute) ?: error("Unknown attribute $rawAttribute"),
        stat = Stat.of(rawStat) ?: error("Unknown stat $rawStat"),
        iconKey = required("iconKey").stringValue(),
    )
}
