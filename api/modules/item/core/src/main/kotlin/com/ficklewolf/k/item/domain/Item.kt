package com.ficklewolf.k.item.domain

import com.ficklewolf.k.shared.kernel.Attribute
import com.ficklewolf.k.shared.kernel.ItemId
import com.ficklewolf.k.shared.kernel.Stat

data class Item(
    val id: ItemId,
    val name: String,
    val attribute: Attribute,
    val stat: Stat,
    val iconKey: String,
)
