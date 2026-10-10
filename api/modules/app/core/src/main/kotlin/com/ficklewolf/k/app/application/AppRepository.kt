package com.ficklewolf.k.app.application

import com.ficklewolf.k.app.domain.App

interface AppRepository {
    fun load(): App
}
