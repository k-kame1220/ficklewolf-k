package com.ficklewolf.k.master.adapter.persistence

import com.ficklewolf.k.master.application.MasterRepository
import com.ficklewolf.k.master.domain.Master
import com.ficklewolf.k.master.domain.MasterFile
import org.springframework.core.io.ClassPathResource
import tools.jackson.databind.json.JsonMapper

class ClasspathMasterRepository(
    private val jsonMapper: JsonMapper,
) : MasterRepository {
    private val master: Master = read()

    override fun load(): Master = master

    private fun read(): Master {
        val files = MasterFile.NAMES.map { MasterFile(it, ClassPathResource("master/$it.json").contentAsByteArray) }
        val settings = files.first { it.name == SETTINGS }
        val minAppVersion = jsonMapper.readTree(settings.content).required("minAppVersion").stringValue()
        return Master(files, minAppVersion)
    }

    private companion object {
        const val SETTINGS = "settings"
    }
}
