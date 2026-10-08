package com.ficklewolf.k.platform.web

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import org.slf4j.MDC
import org.slf4j.event.Level
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter
import java.util.UUID

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
class RequestLoggingFilter : OncePerRequestFilter() {
    private val log = LoggerFactory.getLogger(javaClass)

    override fun shouldNotFilter(request: HttpServletRequest): Boolean = request.requestURI.startsWith("/actuator")

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain,
    ) {
        val requestId =
            request.getHeader(REQUEST_ID_HEADER)?.takeIf { REQUEST_ID_PATTERN.matches(it) }
                ?: UUID.randomUUID().toString()
        val startedAt = System.nanoTime()
        MDC.put(MDC_REQUEST_ID, requestId)
        response.setHeader(REQUEST_ID_HEADER, requestId)

        log
            .atInfo()
            .addKeyValue("event", "request.in")
            .addKeyValue("method", request.method)
            .addKeyValue("path", request.requestURI)
            .log("request")

        try {
            filterChain.doFilter(request, response)
        } finally {
            val status = response.status
            log
                .atLevel(levelOf(status))
                .addKeyValue("event", "request.out")
                .addKeyValue("method", request.method)
                .addKeyValue("path", request.requestURI)
                .addKeyValue("status", status)
                .addKeyValue("durationMs", (System.nanoTime() - startedAt) / NANOS_PER_MILLI)
                .log("response")
            MDC.remove(MDC_REQUEST_ID)
        }
    }

    private fun levelOf(status: Int): Level =
        when {
            status >= SERVER_ERROR -> Level.ERROR
            status >= CLIENT_ERROR -> Level.WARN
            else -> Level.INFO
        }

    private companion object {
        const val REQUEST_ID_HEADER = "X-Request-Id"
        const val MDC_REQUEST_ID = "requestId"
        const val NANOS_PER_MILLI = 1_000_000
        const val CLIENT_ERROR = 400
        const val SERVER_ERROR = 500
        val REQUEST_ID_PATTERN = Regex("^[A-Za-z0-9-]{1,64}$")
    }
}
