plugins {
    id("k.spring-boot-app")
}

dependencies {
    developmentOnly("org.springframework.boot:spring-boot-devtools")
    testImplementation("org.springframework.boot:spring-boot-starter-webmvc-test")
    implementation("org.springframework.boot:spring-boot-starter-webmvc")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("org.jetbrains.kotlin:kotlin-reflect")
    implementation("tools.jackson.module:jackson-module-kotlin")
    implementation(project(":platform:web"))
    implementation(project(":platform:persistence"))
    implementation(project(":modules:player:adapter"))
    implementation(project(":modules:auth:adapter"))
    implementation(project(":modules:master:adapter"))
    implementation(project(":modules:app:adapter"))
}
