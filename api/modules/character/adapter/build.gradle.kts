plugins {
    id("k.spring-adapter")
}

dependencies {
    implementation(project(":platform:web"))
    implementation(project(":modules:character:core"))
}

tasks.processResources {
    from(rootProject.file("../spec/master")) {
        include("characters.json", "settings.json")
        into("character")
    }
}
