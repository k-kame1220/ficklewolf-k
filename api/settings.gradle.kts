pluginManagement {
    includeBuild("build-logic")
}

rootProject.name = "k"

include(
    ":shared:kernel",
    ":modules:player:core",
    ":bootstrap",
)
