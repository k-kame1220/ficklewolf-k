plugins {
    id("k.kotlin-core")
}

dependencies {
    api(project(":modules:item:api"))
    api(project(":modules:weather:api"))
    api(project(":modules:character:api"))
}
