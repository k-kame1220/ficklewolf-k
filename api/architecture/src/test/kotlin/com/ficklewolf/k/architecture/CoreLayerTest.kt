package com.ficklewolf.k.architecture

import com.lemonappdev.konsist.api.Konsist
import com.lemonappdev.konsist.api.declaration.KoFileDeclaration
import com.lemonappdev.konsist.api.verify.assertFalse
import kotlin.test.Test

/** core の中の決まり（docs/05 §3・§4）。モジュールの境界は Gradle の依存で守るので、ここではパッケージの向きを確かめる */
class CoreLayerTest {
    private val coreFiles = Konsist.scopeFromProduction().files.filter { it.path.contains("/core/src/main/") }

    /** `com.ficklewolf.k.<モジュール>.<層>.…` の `<モジュール>` */
    private val KoFileDeclaration.module: String get() =
        packagee
            ?.name
            ?.split(".")
            ?.getOrNull(MODULE_INDEX)
            .orEmpty()

    @Test
    fun `domain は application を import しない（application → domain の一方向）`() {
        coreFiles
            .filter { it.packagee?.name?.contains(".domain") == true }
            .assertFalse { file -> file.imports.any { it.name.contains(".application.") } }
    }

    @Test
    fun `domain はどのモジュールの api も import しない（ほかのモジュールとのやり取りは application がする）`() {
        coreFiles
            .filter { it.packagee?.name?.contains(".domain") == true }
            .assertFalse { file -> file.imports.any { API_IMPORT.matches(it.name) } }
    }

    @Test
    fun `自分のモジュールの api を import するのは Default〇〇Api だけ`() {
        coreFiles
            .filterNot { DEFAULT_API_FILE.matches(it.name) }
            .assertFalse { file -> file.imports.any { it.name.startsWith("com.ficklewolf.k.${file.module}.api.") } }
    }

    @Test
    fun `core は Spring を import しない`() {
        coreFiles.assertFalse { file -> file.imports.any { it.name.startsWith("org.springframework.") } }
    }

    private companion object {
        /** `com.ficklewolf.k.player.application` の `player` の位置 */
        const val MODULE_INDEX = 3
        val API_IMPORT = Regex("""^com\.ficklewolf\.k\.[a-z]+\.api\..+""")
        val DEFAULT_API_FILE = Regex("""^Default[A-Za-z]+Api$""")
    }
}
