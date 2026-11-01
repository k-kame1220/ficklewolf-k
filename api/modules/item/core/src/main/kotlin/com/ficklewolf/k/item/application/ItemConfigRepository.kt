package com.ficklewolf.k.item.application

import com.ficklewolf.k.item.domain.ItemConfig

interface ItemConfigRepository {
    fun load(): ItemConfig
}
