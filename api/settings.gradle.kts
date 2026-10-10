pluginManagement {
    includeBuild("build-logic")
}

rootProject.name = "k"

include(
    ":shared:kernel",
    ":bootstrap",
    ":platform:web",
    ":platform:persistence",
)

file("modules").listFiles()?.filter { it.isDirectory }?.sorted()?.forEach { module ->
    listOf("api", "core", "adapter")
        .filter { file("modules/${module.name}/$it/build.gradle.kts").exists() }
        .forEach { include(":modules:${module.name}:$it") }
}
