plugins {
    id("k.kotlin-core")
}

dependencies {
    api(project(":shared:kernel"))
    api(project(":modules:player:core"))
}
