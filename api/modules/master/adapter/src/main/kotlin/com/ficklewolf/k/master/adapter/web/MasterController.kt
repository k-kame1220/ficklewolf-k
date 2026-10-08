package com.ficklewolf.k.master.adapter.web

import com.ficklewolf.k.master.application.MasterService
import org.springframework.http.CacheControl
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

data class MasterVersionResponse(
    val masterVersion: String,
    val minAppVersion: String,
)

@RestController
@RequestMapping("/master")
class MasterController(
    private val masterService: MasterService,
) {
    @GetMapping("/version")
    fun getVersion(): ResponseEntity<MasterVersionResponse> {
        val master = masterService.current()
        return ResponseEntity
            .ok()
            .cacheControl(CacheControl.noStore())
            .body(MasterVersionResponse(master.version.value, master.minAppVersion))
    }
}
