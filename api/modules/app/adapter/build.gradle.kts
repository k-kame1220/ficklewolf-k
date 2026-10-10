plugins {
    id("k.spring-adapter")
}

dependencies {
    implementation(project(":platform:web"))
    implementation(project(":modules:app:core"))
}

tasks.processResources {
    from(rootProject.file("../spec/master")) {
        include("settings.json")
        into("app")
    }
}
