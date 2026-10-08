import org.springframework.boot.gradle.plugin.SpringBootPlugin

plugins {
    id("k.kotlin-core")
    kotlin("plugin.spring")
}

dependencies {
    implementation(platform(SpringBootPlugin.BOM_COORDINATES))
    testImplementation(platform(SpringBootPlugin.BOM_COORDINATES))
}

kotlin {
    compilerOptions {
        freeCompilerArgs.addAll("-Xjsr305=strict", "-Xannotation-default-target=param-property")
    }
}
