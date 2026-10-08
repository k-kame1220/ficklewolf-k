package com.ficklewolf.k.shared.kernel

interface TransactionRunner {
    fun <T> run(block: () -> T): T
}
