package com.ficklewolf.k.item.domain

import com.ficklewolf.k.shared.kernel.ItemId

data class ItemStack(
    val itemId: ItemId,
    val count: ItemCount,
)
