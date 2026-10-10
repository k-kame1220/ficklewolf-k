package com.ficklewolf.k.app.domain

class App(
    val minAppVersion: String,
) {
    init {
        require(VERSION_PATTERN.matches(minAppVersion)) { "minAppVersion must be x.y.z: $minAppVersion" }
    }

    private companion object {
        val VERSION_PATTERN = Regex("""^\d+\.\d+\.\d+$""")
    }
}
