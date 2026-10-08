package com.ficklewolf.k.master.domain

class Master(
    val files: List<MasterFile>,
    val minAppVersion: String,
) {
    init {
        require(files.map { it.name } == MasterFile.NAMES) { "master files must be ${MasterFile.NAMES}" }
    }

    val version: MasterVersion = MasterVersion.of(files)
}
