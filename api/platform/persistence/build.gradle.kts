plugins {
    id("k.spring-adapter")
}

dependencies {
    api(project(":shared:kernel"))
    implementation("org.springframework:spring-context")
}
