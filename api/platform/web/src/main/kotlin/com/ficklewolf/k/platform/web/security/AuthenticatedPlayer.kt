package com.ficklewolf.k.platform.web.security

import com.ficklewolf.k.shared.kernel.PlayerId

data class AuthenticatedPlayer(
    val playerId: PlayerId,
)
