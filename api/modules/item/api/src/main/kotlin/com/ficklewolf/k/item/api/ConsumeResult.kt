package com.ficklewolf.k.item.api

sealed interface ConsumeResult {
    data object Consumed : ConsumeResult

    data object ItemNotEnough : ConsumeResult
}
