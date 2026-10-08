plugins {
    id("k.spring-adapter")
}

dependencies {
    implementation(project(":platform:web"))
    implementation(project(":modules:master:core"))
}

tasks.processResources {
    from(rootProject.file("../spec/master")) {
        include("*.json")
        into("master")
    }
}
