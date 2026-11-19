plugins {
    id("k.kotlin-core")
}

// アーキテクチャのテストだけを置くモジュール（docs/05 §3・§4 の決まりを Konsist で確かめる）。
// Konsist はソースのファイルを読むので、ほかのモジュールに依存しなくてよい
dependencies {
    testImplementation("com.lemonappdev:konsist:0.17.3")
}

// ほかのモジュールに依存していないので、Gradle はソースが変わってもこのテストを「最新」とみなして飛ばしてしまう。
// 読む対象のソースを入力に入れて、変わったら走るようにする
tasks.test {
    inputs
        .files(fileTree(rootDir) { include("modules/**/src/main/kotlin/**/*.kt") })
        .withPropertyName("checkedSources")
        .withPathSensitivity(PathSensitivity.RELATIVE)
}
