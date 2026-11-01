package com.ficklewolf.k.character.application

import com.ficklewolf.k.character.domain.Character
import com.ficklewolf.k.character.domain.CharacterAssets
import com.ficklewolf.k.character.domain.CharacterConfig
import com.ficklewolf.k.character.domain.CharacterInventory
import com.ficklewolf.k.item.api.ConsumeResult
import com.ficklewolf.k.item.api.ItemApi
import com.ficklewolf.k.shared.kernel.Attribute
import com.ficklewolf.k.shared.kernel.CharacterId
import com.ficklewolf.k.shared.kernel.PlayerId
import com.ficklewolf.k.shared.kernel.Stats
import com.ficklewolf.k.shared.kernel.TransactionRunner
import com.ficklewolf.k.weather.api.TodayWeatherSummary
import com.ficklewolf.k.weather.api.WeatherApi
import java.util.UUID
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse
import kotlin.test.assertIs
import kotlin.test.assertNull
import kotlin.test.assertTrue

class CharacterServiceTest {
    private val zero = character(no = 1, id = "zero", attribute = Attribute.MOON)
    private val a = character(no = 2, id = "a", attribute = Attribute.YANG)
    private val b = character(no = 3, id = "b", attribute = Attribute.NOTE)

    private val masters = listOf(zero, a, b).associateBy { it.id }

    private val characterRepository =
        object : CharacterRepository {
            override fun findById(id: CharacterId): Character? = masters[id]

            override fun listAll(): List<Character> = masters.values.toList()

            override fun listByIds(ids: Collection<CharacterId>): List<Character> = ids.mapNotNull { masters[it] }
        }

    private val inventories = mutableMapOf<PlayerId, CharacterInventory>()

    private val characterInventoryRepository =
        object : CharacterInventoryRepository {
            override fun findByPlayerId(playerId: PlayerId): CharacterInventory? = inventories[playerId]

            override fun save(inventory: CharacterInventory) {
                inventories[inventory.playerId] = inventory
            }
        }

    private var starterCharacterId = CharacterId("zero")

    private val characterConfigRepository =
        object : CharacterConfigRepository {
            override fun load(): CharacterConfig =
                CharacterConfig(
                    starterCharacterId = starterCharacterId,
                    itemUseMax = Stats(hp = 20, attack = 16, defence = 15),
                    itemBonusPerUse = Stats(hp = 42, attack = 18, defence = 2),
                    duplicateBonusPerCount = Stats(hp = 14, attack = 8, defence = 2),
                )
        }

    /** アイテムの残り。consume されたら減らし、足りなければ ItemNotEnough */
    private var itemsLeft = Stats(hp = 99, attack = 99, defence = 99)
    private val consumed = mutableListOf<Stats>()

    private val itemApi =
        object : ItemApi {
            override fun consume(
                playerId: PlayerId,
                attribute: Attribute,
                counts: Stats,
            ): ConsumeResult {
                val left =
                    Stats(
                        itemsLeft.hp - counts.hp,
                        itemsLeft.attack - counts.attack,
                        itemsLeft.defence - counts.defence,
                    )
                if (left.hp < 0 || left.attack < 0 || left.defence < 0) return ConsumeResult.ItemNotEnough
                itemsLeft = left
                consumed += counts
                return ConsumeResult.Consumed
            }

            override fun acquireStarter(playerId: PlayerId) = error("使わない")
        }

    /** 今日は月属性で、攻撃 +60 */
    private val weatherApi =
        object : WeatherApi {
            override fun getToday(): TodayWeatherSummary =
                TodayWeatherSummary(Attribute.MOON, Stats(hp = 0, attack = 60, defence = 0))
        }

    private val transaction =
        object : TransactionRunner {
            override fun <T> run(block: () -> T): T = block()
        }

    private val service =
        characterService(
            itemApi,
            weatherApi,
            characterRepository,
            characterInventoryRepository,
            characterConfigRepository,
            transaction,
        )

    private val player = PlayerId(UUID.randomUUID())
    private val otherPlayer = PlayerId(UUID.randomUUID())

    @Test
    fun `新しいプレイヤーがキャラを手に入れると、持っているキャラになる`() {
        assertEquals(zero, service.acquireCharacter(player, zero.id))

        assertTrue(service.ownsCharacter(player, zero.id))
        assertEquals(listOf(zero.id), service.listOwnedCharacters(player).map { it.id })
    }

    @Test
    fun `まだ何も持っていないプレイヤーの一覧は空`() {
        assertEquals(emptyList(), service.listOwnedCharacters(player))
    }

    @Test
    fun `マスタにないキャラは手に入らず、何も保存しない`() {
        assertNull(service.acquireCharacter(player, CharacterId("nope")))

        assertTrue(inventories.isEmpty())
    }

    @Test
    fun `同じキャラを 2 回手に入れても、一覧には 1 回だけ出る`() {
        service.acquireCharacter(player, a.id)
        service.acquireCharacter(player, a.id)

        assertEquals(listOf(a.id), service.listOwnedCharacters(player).map { it.id })
    }

    @Test
    fun `持っているキャラは、手に入れた順ではなく図鑑の番号順に並ぶ`() {
        service.acquireCharacter(player, b.id)
        service.acquireCharacter(player, zero.id)
        service.acquireCharacter(player, a.id)

        assertEquals(listOf(zero.id, a.id, b.id), service.listOwnedCharacters(player).map { it.id })
    }

    @Test
    fun `ほかのプレイヤーが持っているキャラは、自分の一覧に出ず、持っていることにもならない`() {
        service.acquireCharacter(otherPlayer, a.id)

        assertEquals(emptyList(), service.listOwnedCharacters(player))
        assertFalse(service.ownsCharacter(player, a.id))
    }

    @Test
    fun `天気のボーナスは、天気と同じ属性のキャラだけに付く`() {
        service.acquireCharacter(player, zero.id)
        service.acquireCharacter(player, a.id)

        val owned = service.listOwnedCharacters(player).associateBy { it.id }

        assertEquals(Stats(0, 60, 0), owned.getValue(zero.id).stats.weather)
        assertEquals(Stats.ZERO, owned.getValue(a.id).stats.weather)
    }

    @Test
    fun `強化すると、使った数が増え、アイテム分のステータスが上がる`() {
        service.acquireCharacter(player, zero.id)

        val result = service.enhanceCharacter(player, zero.id, Stats(hp = 2, attack = 1, defence = 0))

        val enhanced = assertIs<EnhanceCharacterResult.Enhanced>(result).ownedCharacter
        assertEquals(Stats(2, 1, 0), enhanced.itemUses)
        assertEquals(Stats(84, 18, 0), enhanced.stats.item)
        assertEquals(Stats(1084, 678, 100), enhanced.stats.total)
        assertEquals(listOf(Stats(2, 1, 0)), consumed)
        assertEquals(Stats(2, 1, 0), service.listOwnedCharacters(player).single().itemUses)
    }

    @Test
    fun `上限を超えるなら EnhanceLimitExceeded で、アイテムを使わない`() {
        service.acquireCharacter(player, zero.id)
        service.enhanceCharacter(player, zero.id, Stats(hp = 20, attack = 0, defence = 0))

        assertEquals(
            EnhanceCharacterResult.EnhanceLimitExceeded,
            service.enhanceCharacter(player, zero.id, Stats(hp = 1, attack = 0, defence = 0)),
        )
        assertEquals(listOf(Stats(20, 0, 0)), consumed)
    }

    @Test
    fun `アイテムが足りなければ ItemNotEnough で、使った数を増やさない`() {
        service.acquireCharacter(player, zero.id)
        itemsLeft = Stats(hp = 1, attack = 0, defence = 0)

        assertEquals(
            EnhanceCharacterResult.ItemNotEnough,
            service.enhanceCharacter(player, zero.id, Stats(hp = 2, attack = 0, defence = 0)),
        )
        assertEquals(Stats.ZERO, service.listOwnedCharacters(player).single().itemUses)
    }

    @Test
    fun `持っていないキャラは CharacterNotOwned で、アイテムを使わない`() {
        service.acquireCharacter(player, zero.id)

        assertEquals(
            EnhanceCharacterResult.CharacterNotOwned,
            service.enhanceCharacter(player, a.id, Stats(hp = 1, attack = 0, defence = 0)),
        )
        assertTrue(consumed.isEmpty())
    }

    @Test
    fun `マスタにないキャラも CharacterNotOwned`() {
        assertEquals(
            EnhanceCharacterResult.CharacterNotOwned,
            service.enhanceCharacter(player, CharacterId("nope"), Stats(hp = 1, attack = 0, defence = 0)),
        )
    }

    @Test
    fun `最初のキャラは設定の starterCharacterId のキャラ`() {
        assertEquals(zero, service.getStarterCharacter())
    }

    @Test
    fun `最初のキャラがマスタになければ例外（データの誤り）`() {
        starterCharacterId = CharacterId("nope")

        assertFailsWith<IllegalStateException> { service.getStarterCharacter() }
    }

    private fun character(
        no: Int,
        id: String,
        attribute: Attribute,
    ): Character =
        Character(
            no = no,
            id = CharacterId(id),
            name = id.uppercase(),
            attribute = attribute,
            description = "",
            assets = CharacterAssets("characters/$id/main", "characters/$id/icon", "characters/$id/home"),
            baseStats = Stats(hp = 1000, attack = 600, defence = 100),
            duplicateBonusMax = Stats(hp = 5, attack = 5, defence = 5),
        )
}
