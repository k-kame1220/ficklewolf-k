plugins {
    id("k.kotlin-core")
}

dependencies {
    api(project(":modules:quest:api"))
    api(project(":modules:player:api"))
    api(project(":modules:weather:api"))
}
