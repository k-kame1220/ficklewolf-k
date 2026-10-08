package com.ficklewolf.k.platform.persistence

import com.ficklewolf.k.shared.kernel.TransactionRunner
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class PersistenceConfiguration {
    @Bean
    fun transactionRunner(): TransactionRunner =
        object : TransactionRunner {
            override fun <T> run(block: () -> T): T = block()
        }
}
