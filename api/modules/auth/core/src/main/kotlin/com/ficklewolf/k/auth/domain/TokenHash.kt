package com.ficklewolf.k.auth.domain

import java.security.MessageDigest

@JvmInline
value class TokenHash private constructor(
    val value: String,
) {
    companion object {
        fun of(rawToken: String): TokenHash {
            val digest = MessageDigest.getInstance("SHA-256").digest(rawToken.toByteArray())
            return TokenHash(digest.joinToString("") { "%02x".format(it) })
        }
    }
}
