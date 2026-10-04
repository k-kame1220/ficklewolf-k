package com.ficklewolf.k.auth.adapter.persistence

import com.ficklewolf.k.auth.application.AuthTokenRepository
import com.ficklewolf.k.auth.domain.AuthToken
import com.ficklewolf.k.auth.domain.TokenHash
import java.util.concurrent.ConcurrentHashMap

class InMemoryAuthTokenRepository : AuthTokenRepository {
    private val tokens = ConcurrentHashMap<TokenHash, AuthToken>()

    override fun save(token: AuthToken) {
        tokens[token.hash] = token
    }

    override fun findByHash(hash: TokenHash): AuthToken? = tokens[hash]
}
