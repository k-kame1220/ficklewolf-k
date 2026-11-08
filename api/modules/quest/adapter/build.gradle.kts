plugins {
    id("k.spring-adapter")
}

dependencies {
    implementation(project(":platform:web"))
    implementation(project(":modules:quest:core"))
}

tasks.processResources {
    from(rootProject.file("../spec/master")) {
        include("quests.json")
        into("quest")
    }
}
