package com.ficklewolf.k.master.adapter.web

import com.ficklewolf.k.master.application.MasterService
import com.ficklewolf.k.master.domain.Master
import org.springframework.http.CacheControl
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.context.request.WebRequest
import tools.jackson.databind.JsonNode
import tools.jackson.databind.json.JsonMapper

data class MasterVersionResponse(
    val masterVersion: String,
    val minAppVersion: String,
)

@RestController
@RequestMapping("/master")
class MasterController(
    private val masterService: MasterService,
    private val jsonMapper: JsonMapper,
) {
    @GetMapping("/version")
    fun getVersion(): ResponseEntity<MasterVersionResponse> {
        val master = masterService.current()
        return ResponseEntity
            .ok()
            .cacheControl(CacheControl.noStore())
            .body(MasterVersionResponse(master.version.value, master.minAppVersion))
    }

    @GetMapping
    fun getMaster(request: WebRequest): ResponseEntity<JsonNode>? {
        val master = masterService.current()
        val etag = "\"${master.version.value}\""
        if (request.checkNotModified(etag)) return null

        return ResponseEntity
            .ok()
            .eTag(etag)
            .cacheControl(CacheControl.noCache())
            .body(toResponse(master))
    }

    private fun toResponse(master: Master): JsonNode {
        val body = jsonMapper.createObjectNode()
        body.put("version", master.version.value)
        master.files.forEach { body.set(it.name, jsonMapper.readTree(it.content)) }
        return body
    }
}
