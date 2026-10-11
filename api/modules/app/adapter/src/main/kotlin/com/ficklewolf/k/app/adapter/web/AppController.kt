package com.ficklewolf.k.app.adapter.web

import com.ficklewolf.k.app.application.AppService
import org.springframework.http.CacheControl
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

data class AppVersionResponse(
    val minAppVersion: String,
)

@RestController
class AppController(
    private val appService: AppService,
) {
    @GetMapping("/app/version")
    fun getAppVersion(): ResponseEntity<AppVersionResponse> {
        val app = appService.current()
        return ResponseEntity
            .ok()
            .cacheControl(CacheControl.noStore())
            .body(AppVersionResponse(app.minAppVersion))
    }
}
