package com.ficklewolf.k.auth.application

interface TokenGenerator {
    fun generate(): String
}
