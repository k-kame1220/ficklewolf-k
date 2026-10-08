package com.ficklewolf.k.master.application

import com.ficklewolf.k.master.domain.Master

interface MasterService {
    fun current(): Master
}

fun masterService(repository: MasterRepository): MasterService = DefaultMasterService(repository)

internal class DefaultMasterService(
    private val repository: MasterRepository,
) : MasterService {
    override fun current(): Master = repository.load()
}
