package com.ficklewolf.k.platform.web.security

import org.springframework.beans.factory.ObjectProvider
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter

@Configuration
class SecurityConfiguration {
    @Bean
    fun securityFilterChain(
        http: HttpSecurity,
        tokenAuthenticator: TokenAuthenticator,
        publicEndpoints: ObjectProvider<PublicEndpoint>,
    ): SecurityFilterChain {
        http
            .csrf { it.disable() }
            .httpBasic { it.disable() }
            .formLogin { it.disable() }
            .sessionManagement { it.sessionCreationPolicy(SessionCreationPolicy.STATELESS) }
            .authorizeHttpRequests { authorize ->
                publicEndpoints.forEach { authorize.requestMatchers(it.method, it.path).permitAll() }
                authorize.requestMatchers("/actuator/health", "/error").permitAll()
                authorize.anyRequest().authenticated()
            }.exceptionHandling { it.authenticationEntryPoint(ProblemDetailsAuthenticationEntryPoint()) }
            .addFilterBefore(
                BearerTokenAuthenticationFilter(tokenAuthenticator),
                UsernamePasswordAuthenticationFilter::class.java,
            )
        return http.build()
    }
}
