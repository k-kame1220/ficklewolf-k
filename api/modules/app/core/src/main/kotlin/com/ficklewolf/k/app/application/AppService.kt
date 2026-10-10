package com.ficklewolf.k.app.application

import com.ficklewolf.k.app.domain.App

interface AppService {
    fun current(): App
}

fun appService(repository: AppRepository): AppService = DefaultAppService(repository)

internal class DefaultAppService(
    private val repository: AppRepository,
) : AppService {
    override fun current(): App = repository.load()
}
