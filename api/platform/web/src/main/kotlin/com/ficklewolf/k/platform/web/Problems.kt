package com.ficklewolf.k.platform.web

import org.springframework.http.HttpStatus
import org.springframework.http.ProblemDetail
import org.springframework.http.ResponseEntity

object CommonErrorCode {
    const val VALIDATION_FAILED = "VALIDATION_FAILED"
    const val UNAUTHORIZED = "UNAUTHORIZED"
    const val INTERNAL_ERROR = "INTERNAL_ERROR"
}

fun problemDetail(
    status: HttpStatus,
    code: String,
    detail: String,
): ProblemDetail =
    ProblemDetail.forStatusAndDetail(status, detail).apply {
        setProperty("code", code)
    }

fun problemResponse(
    status: HttpStatus,
    code: String,
    detail: String,
): ResponseEntity<ProblemDetail> = ResponseEntity.status(status).body(problemDetail(status, code, detail))
