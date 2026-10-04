package com.ficklewolf.k.auth.adapter.security

import com.ficklewolf.k.auth.application.TokenGenerator
import java.security.SecureRandom
import java.util.Base64

class SecureRandomTokenGenerator : TokenGenerator {
    private val random = SecureRandom()

    override fun generate(): String {
        val bytes = ByteArray(TOKEN_BYTES).also { random.nextBytes(it) }
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes)
    }

    private companion object {
        const val TOKEN_BYTES = 32
    }
}
