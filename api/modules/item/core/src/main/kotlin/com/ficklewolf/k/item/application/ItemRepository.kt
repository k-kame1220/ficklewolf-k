package com.ficklewolf.k.item.application

import com.ficklewolf.k.item.domain.Item
import com.ficklewolf.k.shared.kernel.Attribute
import com.ficklewolf.k.shared.kernel.ItemId

interface ItemRepository {
    fun findById(id: ItemId): Item?

    fun listAll(): List<Item>

    fun listByAttribute(attribute: Attribute): List<Item>
}
