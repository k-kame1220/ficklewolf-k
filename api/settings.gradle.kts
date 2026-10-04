pluginManagement {
    includeBuild("build-logic")
}

rootProject.name = "k"

include(
    ":shared:kernel",
    ":bootstrap",
    ":platform:persistence",
    ":modules:player:api",
    ":modules:player:core",
    ":modules:player:adapter",
    ":modules:auth:core",
)
