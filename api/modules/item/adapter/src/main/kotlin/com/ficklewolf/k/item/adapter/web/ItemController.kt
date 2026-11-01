package com.ficklewolf.k.item.adapter.web

import com.ficklewolf.k.item.application.ItemService
import com.ficklewolf.k.item.domain.OwnedItem
import com.ficklewolf.k.platform.web.security.AuthenticatedPlayer
import com.ficklewolf.k.platform.web.security.CurrentPlayer
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

data class MyItemResponse(
    val id: String,
    val name: String,
    val attribute: String,
    val stat: String,
    val iconKey: String,
    val count: Int,
)

data class MyItemListResponse(
    val items: List<MyItemResponse>,
)

@RestController
class ItemController(
    private val itemService: ItemService,
) {
    @GetMapping("/me/items")
    fun listMyItems(
        @CurrentPlayer player: AuthenticatedPlayer,
    ): ResponseEntity<MyItemListResponse> {
        val items = itemService.listOwnedItems(player.playerId)
        return ResponseEntity.ok(MyItemListResponse(items.map { it.toResponse() }))
    }
}

private fun OwnedItem.toResponse(): MyItemResponse =
    MyItemResponse(
        id = item.id.value,
        name = item.name,
        attribute = item.attribute.value,
        stat = item.stat.value,
        iconKey = item.iconKey,
        count = count.value,
    )
