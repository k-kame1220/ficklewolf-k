package com.ficklewolf.k.platform.web

import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpHeaders
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.CorsConfigurationSource
import org.springframework.web.cors.UrlBasedCorsConfigurationSource

@Configuration
class WebCorsConfiguration {
    @Bean
    fun corsConfigurationSource(
        @Value($$"${k.cors.allowed-origins}") allowedOrigins: List<String>,
    ): CorsConfigurationSource {
        val config = CorsConfiguration()
        config.allowedOrigins = allowedOrigins
        config.allowedMethods = listOf("GET", "POST", "PATCH")
        config.allowedHeaders = listOf(HttpHeaders.AUTHORIZATION, HttpHeaders.CONTENT_TYPE)
        config.exposedHeaders = listOf("X-Request-Id")
        config.maxAge = MAX_AGE_SECONDS

        val source = UrlBasedCorsConfigurationSource()
        source.registerCorsConfiguration("/**", config)
        return source
    }

    private companion object {
        const val MAX_AGE_SECONDS = 3600L
    }
}
