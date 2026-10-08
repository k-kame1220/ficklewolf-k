plugins {
    id("k.spring-adapter")
}

dependencies {
    implementation(project(":platform:web"))
    implementation(project(":modules:auth:core"))
    implementation("org.springframework.boot:spring-boot-starter-webmvc")
}
