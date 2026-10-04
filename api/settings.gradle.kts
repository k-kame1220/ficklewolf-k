pluginManagement {
    includeBuild("build-logic")
}

rootProject.name = "k"

include(
    ":shared:kernel",
    ":bootstrap",
    ":platform:web",
    ":platform:persistence",
    ":modules:player:api",
    ":modules:player:core",
    ":modules:player:adapter",
    ":modules:auth:adapter",
    ":modules:auth:core",
)
