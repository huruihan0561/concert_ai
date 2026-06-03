package com.concert.controller;

import com.concert.config.ChatMemoryStore;
import com.concert.service.CelebrityAgentService;
import com.concert.vo.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/celebrity")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "歌手对话模拟器", description = "与AI模拟的歌手进行对话")
public class CelebrityAgentController {

    private final CelebrityAgentService celebrityAgentService;

    @GetMapping("/list")
    @Operation(summary = "获取歌手列表", description = "获取所有可对话的歌手名单")
    public Result<List<Map<String, Object>>> getCelebrityList() {
        return Result.ok(celebrityAgentService.getCelebrityList());
    }

    @PostMapping("/chat")
    @Operation(summary = "与歌手对话", description = "与指定的AI歌手进行对话，AI会模仿歌手的语气和风格")
    public Result<String> chat(
            @Parameter(description = "对话请求参数", required = true) @RequestBody ChatRequest request) {
        log.info("歌手对话: sessionId={}, singer={}, message={}", request.getSessionId(), request.getSinger(), request.getMessage());
        String response = celebrityAgentService.chat(request.getSessionId(), request.getSinger(), request.getMessage());
        return Result.ok(response);
    }

    @PostMapping("/clear")
    @Operation(summary = "清空对话历史", description = "清空指定会话的所有历史消息")
    public Result<Void> clearSession(
            @Parameter(description = "会话ID", required = true) @RequestParam String sessionId) {
        log.info("清空会话: sessionId={}", sessionId);
        celebrityAgentService.clearSession(sessionId);
        return Result.ok(null);
    }

    @GetMapping("/history")
    @Operation(summary = "获取对话历史", description = "获取指定会话的所有历史消息")
    public Result<List<ChatMemoryStore.Message>> getHistory(
            @Parameter(description = "会话ID", required = true) @RequestParam String sessionId) {
        return Result.ok(celebrityAgentService.getHistory(sessionId));
    }

    @Data
    public static class ChatRequest {
        @Parameter(description = "会话ID", required = true)
        private String sessionId;
        @Parameter(description = "歌手名称", required = true)
        private String singer;
        @Parameter(description = "用户消息", required = true)
        private String message;
    }
}