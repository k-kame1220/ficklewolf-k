import org.springframework.boot.gradle.plugin.SpringBootPlugin

plugins {
    id("k.spring-adapter")
    id("org.springframework.boot")
}

dependencies {
    "developmentOnly"(platform(SpringBootPlugin.BOM_COORDINATES))
}
