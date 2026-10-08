package com.ficklewolf.k.master.domain

import java.security.MessageDigest

@JvmInline
value class MasterVersion private constructor(
    val value: String,
) {
    companion object {
        private const val LENGTH = 16

        fun of(files: List<MasterFile>): MasterVersion {
            val digest = MessageDigest.getInstance("SHA-256")
            files.forEach { file ->
                digest.update("${file.name}.json\n".toByteArray())
                digest.update(file.content)
            }
            val hex = digest.digest().joinToString("") { "%02x".format(it) }
            return MasterVersion(hex.take(LENGTH))
        }
    }
}
