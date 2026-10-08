package com.ficklewolf.k.master.adapter

import com.ficklewolf.k.master.adapter.persistence.ClasspathMasterRepository
import com.ficklewolf.k.master.application.MasterRepository
import com.ficklewolf.k.master.application.MasterService
import com.ficklewolf.k.platform.web.security.PublicEndpoint
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpMethod
import tools.jackson.databind.json.JsonMapper
import com.ficklewolf.k.master.application.masterService as createMasterService

@Configuration
class MasterConfiguration {
    @Bean
    fun masterRepository(jsonMapper: JsonMapper): MasterRepository = ClasspathMasterRepository(jsonMapper)

    @Bean
    fun masterService(masterRepository: MasterRepository): MasterService = createMasterService(masterRepository)

    @Bean
    fun masterVersionEndpoint(): PublicEndpoint = PublicEndpoint(HttpMethod.GET, "/master/version")

    @Bean
    fun masterEndpoint(): PublicEndpoint = PublicEndpoint(HttpMethod.GET, "/master")
}
