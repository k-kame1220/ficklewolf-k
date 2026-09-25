package com.ficklewolf.k

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class KApplication

fun main(args: Array<String>) {
    runApplication<KApplication>(*args)
}
