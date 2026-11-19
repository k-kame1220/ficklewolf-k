plugins {
    id("k.kotlin-core")
}

// アーキテクチャのテストだけを置くモジュール（docs/05 §3・§4 の決まりを Konsist で確かめる）。
// Konsist はソースのファイルを読むので、ほかのモジュールに依存しなくてよい
dependencies {
    testImplementation("com.lemonappdev:konsist:0.17.3")
}

// ほかのモジュールに依存していないので、Gradle はソースが変わってもこのテストを「最新」とみなして飛ばしてしまう。
// 読む対象のソース（modules/<名前>/<api・core・adapter>/src/main/kotlin）を入力に入れて、変わったら走るようにする。
// 入力の根を api/ 全体にすると、ほかのモジュールの build/ と重なって Gradle 9 が止めるので、ソースのフォルダだけを並べる
val checkedSourceDirs =
    rootDir
        .resolve("modules")
        .listFiles()
        .orEmpty()
        .flatMap { module -> listOf("api", "core", "adapter").map { module.resolve("$it/src/main/kotlin") } }
        .filter { it.isDirectory }

tasks.test {
    inputs
        .files(checkedSourceDirs)
        .withPropertyName("checkedSources")
        .withPathSensitivity(PathSensitivity.RELATIVE)
}
