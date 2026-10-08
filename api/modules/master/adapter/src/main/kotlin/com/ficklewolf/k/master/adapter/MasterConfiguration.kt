package com.ficklewolf.k.master.adapter

import com.ficklewolf.k.master.adapter.persistence.ClasspathMasterRepository
import com.ficklewolf.k.master.application.MasterRepository
import com.ficklewolf.k.master.application.MasterService
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import tools.jackson.databind.json.JsonMapper
import com.ficklewolf.k.master.application.masterService as createMasterService

@Configuration
class MasterConfiguration {
    @Bean
    fun masterRepository(jsonMapper: JsonMapper): MasterRepository = ClasspathMasterRepository(jsonMapper)

    @Bean
    fun masterService(masterRepository: MasterRepository): MasterService = createMasterService(masterRepository)
}
