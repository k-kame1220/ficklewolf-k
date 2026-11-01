package com.ficklewolf.k.item.application

import com.ficklewolf.k.item.domain.Item
import com.ficklewolf.k.item.domain.ItemConfig
import com.ficklewolf.k.item.domain.ItemCount
import com.ficklewolf.k.item.domain.ItemInventory
import com.ficklewolf.k.item.domain.ItemStack
import com.ficklewolf.k.shared.kernel.Attribute
import com.ficklewolf.k.shared.kernel.ItemId
import com.ficklewolf.k.shared.kernel.PlayerId
import com.ficklewolf.k.shared.kernel.Stat
import com.ficklewolf.k.shared.kernel.Stats
import com.ficklewolf.k.shared.kernel.TransactionRunner
import java.util.UUID
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertNotNull
import kotlin.test.assertNull

class ItemServiceTest {
    /** マスタの順: 陽の 3 種 → 月の 3 種 */
    private val masters =
        listOf(Attribute.YANG, Attribute.MOON).flatMap { attribute ->
            Stat.entries.map { stat ->
                Item(ItemId("${attribute.value}-${stat.value}"), "", attribute, stat, "")
            }
        }

    private val itemRepository =
        object : ItemRepository {
            override fun findById(id: ItemId): Item? = masters.find { it.id == id }

            override fun listAll(): List<Item> = masters

            override fun listByAttribute(attribute: Attribute): List<Item> =
                masters.filter { it.attribute == attribute }
        }

    private val inventories = mutableMapOf<PlayerId, ItemInventory>()

    private val itemInventoryRepository =
        object : ItemInventoryRepository {
            override fun findByPlayerId(playerId: PlayerId): ItemInventory? = inventories[playerId]

            override fun save(inventory: ItemInventory) {
                inventories[inventory.playerId] = inventory
            }
        }

    private val itemConfigRepository =
        object : ItemConfigRepository {
            override fun load(): ItemConfig =
                ItemConfig(listOf(stack("moon-hp", 3), stack("moon-attack", 3), stack("moon-defence", 3)))
        }

    private val transaction =
        object : TransactionRunner {
            override fun <T> run(block: () -> T): T = block()
        }

    private val service = itemService(itemRepository, itemInventoryRepository, itemConfigRepository, transaction)

    private val player = PlayerId(UUID.randomUUID())
    private val otherPlayer = PlayerId(UUID.randomUUID())

    @Test
    fun `最初のアイテムを渡すと、一覧に設定どおりの数が出る`() {
        service.acquireStarterItems(player)

        assertEquals(
            listOf("moon-hp" to 3, "moon-attack" to 3, "moon-defence" to 3),
            service.listOwnedItems(player).map { it.item.id.value to it.count.value },
        )
    }

    @Test
    fun `一覧は手に入れた順ではなくマスタの順で、0 個のものは出ない`() {
        service.acquireItems(player, listOf(stack("moon-hp", 1), stack("yang-defence", 2)))
        service.consumeItemsByAttribute(player, Attribute.MOON, Stats(hp = 1, attack = 0, defence = 0))

        assertEquals(listOf("yang-defence"), service.listOwnedItems(player).map { it.item.id.value })
    }

    @Test
    fun `ほかのプレイヤーのアイテムは自分の一覧に出ない`() {
        service.acquireStarterItems(otherPlayer)

        assertEquals(emptyList(), service.listOwnedItems(player))
    }

    @Test
    fun `マスタにないアイテムを渡そうとすると例外（データの誤り）`() {
        assertFailsWith<IllegalStateException> { service.acquireItems(player, listOf(stack("nope", 1))) }
    }

    @Test
    fun `属性に合うアイテムを、ステータスごとの数だけ使う`() {
        service.acquireStarterItems(player)

        assertNotNull(service.consumeItemsByAttribute(player, Attribute.MOON, Stats(hp = 2, attack = 1, defence = 0)))
        assertEquals(listOf(1, 2, 3), service.listOwnedItems(player).map { it.count.value })
    }

    @Test
    fun `1 つでも足りなければ ItemNotEnough で、何も減らさない`() {
        service.acquireStarterItems(player)

        assertNull(service.consumeItemsByAttribute(player, Attribute.MOON, Stats(hp = 1, attack = 4, defence = 0)))
        assertEquals(listOf(3, 3, 3), service.listOwnedItems(player).map { it.count.value })
    }

    @Test
    fun `ちがう属性のアイテムは使えない`() {
        service.acquireStarterItems(player)

        assertNull(service.consumeItemsByAttribute(player, Attribute.YANG, Stats(hp = 1, attack = 0, defence = 0)))
    }

    private fun stack(
        id: String,
        count: Int,
    ): ItemStack = ItemStack(ItemId(id), ItemCount.of(count) ?: error("個数が使えない"))
}
