package com.ficklewolf.k.platform.web.security

import com.ficklewolf.k.shared.kernel.PlayerId

fun interface TokenAuthenticator {
    fun authenticate(token: String): PlayerId?
}
