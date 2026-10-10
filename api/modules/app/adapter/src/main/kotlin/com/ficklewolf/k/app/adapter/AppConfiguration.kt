package com.ficklewolf.k.app.adapter

import com.ficklewolf.k.app.adapter.persistence.ClasspathAppRepository
import com.ficklewolf.k.app.application.AppRepository
import com.ficklewolf.k.app.application.AppService
import com.ficklewolf.k.platform.web.security.PublicEndpoint
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpMethod
import tools.jackson.databind.json.JsonMapper
import com.ficklewolf.k.app.application.appService as createAppService

@Configuration
class AppConfiguration {
    @Bean
    fun appRepository(jsonMapper: JsonMapper): AppRepository = ClasspathAppRepository(jsonMapper)

    @Bean
    fun appService(appRepository: AppRepository): AppService = createAppService(appRepository)

    @Bean
    fun appVersionEndpoint(): PublicEndpoint = PublicEndpoint(HttpMethod.GET, "/app/version")
}
