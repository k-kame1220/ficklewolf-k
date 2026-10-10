package com.ficklewolf.k.app.adapter.persistence

import com.ficklewolf.k.app.application.AppRepository
import com.ficklewolf.k.app.domain.App
import org.springframework.core.io.ClassPathResource
import tools.jackson.databind.json.JsonMapper

class ClasspathAppRepository(
    private val jsonMapper: JsonMapper,
) : AppRepository {
    private val app: App = read()

    override fun load(): App = app

    private fun read(): App {
        val settings = ClassPathResource("app/settings.json").contentAsByteArray
        val minAppVersion = jsonMapper.readTree(settings).required("minAppVersion").stringValue()
        return App(minAppVersion)
    }
}
