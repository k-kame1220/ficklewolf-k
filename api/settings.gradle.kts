pluginManagement {
    includeBuild("build-logic")
}

rootProject.name = "k"

include(
    ":shared:kernel",
    ":bootstrap",
    ":modules:player:core",
    ":modules:auth:core",
)
