package com.ficklewolf.k.auth.application

import com.ficklewolf.k.auth.domain.AuthToken
import com.ficklewolf.k.auth.domain.TokenHash

interface AuthTokenRepository {
    fun save(token: AuthToken)

    fun findByHash(hash: TokenHash): AuthToken?
}
