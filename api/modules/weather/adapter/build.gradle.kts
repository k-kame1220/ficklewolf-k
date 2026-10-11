plugins {
    id("k.spring-adapter")
}

dependencies {
    implementation(project(":platform:web"))
    implementation(project(":modules:weather:core"))
}

tasks.processResources {
    from(rootProject.file("../spec/master")) {
        include("weathers.json")
        into("weather")
    }
}
