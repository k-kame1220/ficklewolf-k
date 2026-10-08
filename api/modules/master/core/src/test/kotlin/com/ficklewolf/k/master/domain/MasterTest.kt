package com.ficklewolf.k.master.domain

import kotlin.test.Test
import kotlin.test.assertFailsWith

class MasterTest {
    private fun filesOf(names: List<String>): List<MasterFile> = names.map { MasterFile(it, "{}".toByteArray()) }

    @Test
    fun `決まった順にそろっていれば作れる`() {
        Master(filesOf(MasterFile.NAMES), "0.1.0")
    }

    @Test
    fun `ファイルが足りないと作れない`() {
        assertFailsWith<IllegalArgumentException> {
            Master(filesOf(MasterFile.NAMES.drop(1)), "0.1.0")
        }
    }

    @Test
    fun `順番が違うと作れない`() {
        assertFailsWith<IllegalArgumentException> {
            Master(filesOf(MasterFile.NAMES.reversed()), "0.1.0")
        }
    }
}
