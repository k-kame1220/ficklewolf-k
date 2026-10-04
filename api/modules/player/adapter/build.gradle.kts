plugins {
    id("k.spring-adapter")
}

dependencies {
    implementation(project(":modules:player:core"))
    implementation("org.springframework:spring-context")
}
