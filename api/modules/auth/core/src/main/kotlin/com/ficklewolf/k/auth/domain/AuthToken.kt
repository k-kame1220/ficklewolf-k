package com.ficklewolf.k.auth.domain

import com.ficklewolf.k.shared.kernel.PlayerId
import java.time.Instant

data class AuthToken(
    val hash: TokenHash,
    val playerId: PlayerId,
    val createdAt: Instant,
)
