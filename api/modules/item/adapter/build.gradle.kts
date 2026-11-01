plugins {
    id("k.spring-adapter")
}

dependencies {
    implementation(project(":platform:web"))
    implementation(project(":modules:item:core"))
}

tasks.processResources {
    from(rootProject.file("../spec/master")) {
        include("items.json", "settings.json")
        into("item")
    }
}
