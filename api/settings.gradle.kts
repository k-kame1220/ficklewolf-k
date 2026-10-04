pluginManagement {
    includeBuild("build-logic")
}

rootProject.name = "k"

include(
    ":shared:kernel",
    ":bootstrap",
    ":modules:player:api",
    ":modules:player:core",
    ":modules:auth:core",
)
