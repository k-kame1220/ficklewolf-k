package com.ficklewolf.k.platform.web.security

import org.springframework.http.HttpMethod

data class PublicEndpoint(
    val method: HttpMethod,
    val path: String,
)
