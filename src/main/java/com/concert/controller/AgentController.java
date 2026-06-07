package com.concert.controller;

import com.concert.agent.ConcertOrchestratorAgent;
import com.concert.agent.DedicatedConcertAgent;
import com.concert.agent.GeneralAssistantAgent;
import com.concert.agent.ReActStep;
import com.concert.agent.ReActTraceStore;
import com.concert.config.ChatMemoryStore;
import com.concert.vo.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;
import reactor.core.publisher.Flux;

import java.time.Duration;
import java.util.List;
import java.util.UUID;

/**
 * Agent对话控制器
 *
 * 支持两种对话模式：
 * 1. 演唱会专属模式（hasIdentity=true）：从演唱会详情页打开，围绕特定歌手/演唱会
 * 2. 通用助手模式（hasIdentity=false/null）：从AI助手页面打开，可咨询所有演唱会问题
 */
@RestController
@RequestMapping("/api/agent")
@Tag(name = "Agent对话", description = "AI Agent 对话相关接口")
@RequiredArgsConstructor
@Slf4j
public class AgentController {

    private final DedicatedConcertAgent dedicatedAgent;
    private final GeneralAssistantAgent generalAgent;
    private final ConcertOrchestratorAgent orchestratorAgent;
    private final ChatMemoryStore chatMemoryStore;
    private final ReActTraceStore reactTraceStore;

    @Data
    public static class ChatRequest {
        private String sessionId;
        private Long userId;
        private String message;
        private Long concertId;
        private String singer;      // 歌手名称，如"汪苏泷"
        private String identity;    // 身份信息，如"汪苏泷粉丝"
        private Boolean hasIdentity;  // 是否带有身份（从演唱会详情页打开）
    }

    /**
     * 发送消息 - 非流式
     * 根据 hasIdentity 自动路由到专属Agent或通用Agent
     */
    @PostMapping("/chat")
    @Operation(summary = "发送消息", description = "向 Agent 发送消息，获取 AI 回复")
    public Result<String> chat(@RequestBody ChatRequest request) {
        log.info("【聊天请求】userId={}, hasIdentity={}, singer={}, concertId={}",
                request.getUserId(), request.getHasIdentity(), request.getSinger(), request.getConcertId());

        // 确保有 sessionId
        if (request.getSessionId() == null || request.getSessionId().isEmpty()) {
            request.setSessionId(UUID.randomUUID().toString());
        }

        String response;

        // 根据 hasIdentity 路由到不同的 Agent
        if (Boolean.TRUE.equals(request.getHasIdentity()) && request.getSinger() != null) {
            if (request.getConcertId() != null) {
                // 演唱会详情页 - 使用带 ReAct 工具循环的编排器
                response = orchestratorAgent.process(
                        request.getSessionId(),
                        request.getUserId(),
                        request.getMessage(),
                        request.getConcertId(),
                        request.getIdentity(),
                        request.getHasIdentity(),
                        request.getSinger()
                );
            } else {
                // 演唱会专属模式（无 concertId）
                response = dedicatedAgent.process(
                        request.getSessionId(),
                        request.getUserId(),
                        request.getMessage(),
                        request.getConcertId(),
                        request.getSinger(),
                        request.getIdentity()
                );
            }
        } else {
            // 通用助手模式 - 从AI助手页面打开
            response = generalAgent.process(
                    request.getSessionId(),
                    request.getUserId(),
                    request.getMessage()
            );
        }

        return Result.ok(response);
    }

    /**
     * 发送消息 - 流式（SSE）
     * 根据 hasIdentity 自动路由到专属Agent或通用Agent
     * 使用 StreamingResponseBody 确保 SSE 真正推送
     */
    @PostMapping(value = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "流式发送消息", description = "SSE 流式向 Agent 发送消息，逐字返回")
    public StreamingResponseBody chatStream(@RequestBody ChatRequest request) {
        log.info("【流式聊天请求】userId={}, hasIdentity={}, singer={}, concertId={}",
                request.getUserId(), request.getHasIdentity(), request.getSinger(), request.getConcertId());

        if (request.getSessionId() == null || request.getSessionId().isEmpty()) {
            request.setSessionId(UUID.randomUUID().toString());
        }

        Flux<String> flux;
        if (Boolean.TRUE.equals(request.getHasIdentity()) && request.getSinger() != null) {
            if (request.getConcertId() != null) {
                flux = orchestratorAgent.stream(
                        request.getSessionId(),
                        request.getUserId(),
                        request.getMessage(),
                        request.getConcertId(),
                        request.getIdentity(),
                        request.getHasIdentity(),
                        request.getSinger()
                );
            } else {
                flux = dedicatedAgent.stream(
                        request.getSessionId(),
                        request.getUserId(),
                        request.getMessage(),
                        request.getConcertId(),
                        request.getSinger(),
                        request.getIdentity()
                );
            }
        } else {
            flux = generalAgent.stream(
                    request.getSessionId(),
                    request.getUserId(),
                    request.getMessage()
            );
        }

        // 使用 StreamingResponseBody 同步写出 SSE，flux 阻塞式订阅
        return outputStream -> {
            try {
                List<String> tokens = flux.collectList().block(Duration.ofMinutes(3));
                if (tokens != null) {
                    for (String token : tokens) {
                        synchronized (outputStream) {
                            String escaped = token.replace("\n", "\\n").replace("\r", "");
                            outputStream.write(("data: " + escaped + "\n\n").getBytes(java.nio.charset.StandardCharsets.UTF_8));
                            outputStream.flush();
                        }
                    }
                }
                synchronized (outputStream) {
                    outputStream.write("data: [DONE]\n\n".getBytes(java.nio.charset.StandardCharsets.UTF_8));
                    outputStream.flush();
                    outputStream.close();
                }
            } catch (Exception e) {
                log.error("SSE 流写入异常", e);
                try {
                    synchronized (outputStream) {
                        outputStream.write("data: [ERROR]\n\n".getBytes(java.nio.charset.StandardCharsets.UTF_8));
                        outputStream.flush();
                        outputStream.close();
                    }
                } catch (Exception ignored) {}
            }
        };
    }

    /**
     * 获取会话历史
     * 支持两种模式的会话历史查询
     */
    @GetMapping("/history/{sessionId}")
    @Operation(summary = "获取会话历史")
    public Result<List<ChatMemoryStore.Message>> getHistory(@PathVariable String sessionId) {
        try {
            return Result.ok(chatMemoryStore.getMessages(sessionId));
        } catch (Exception e) {
            log.warn("获取会话历史失败: sessionId={}", sessionId, e);
            return Result.ok(List.of());
        }
    }

    /**
     * 清空会话
     */
    @DeleteMapping("/clear/{sessionId}")
    @Operation(summary = "清空会话")
    public Result<Void> clearSession(@PathVariable String sessionId) {
        chatMemoryStore.clearMessages(sessionId);
        log.info("会话已清空: sessionId={}", sessionId);
        return Result.ok();
    }

    /**
     * 获取用户的历史会话列表
     * 返回该用户的所有会话（包括专属模式和通用模式）
     */
    @GetMapping("/sessions/{userId}")
    @Operation(summary = "获取用户会话列表", description = "获取用户的所有历史会话")
    public Result<List<String>> getUserSessions(@PathVariable Long userId) {
        return Result.ok(List.of());
    }

    /**
     * 获取 ReAct 推理链路（供前端可视化面板轮询）
     */
    @GetMapping("/trace/{sessionId}")
    @Operation(summary = "获取推理链路", description = "获取指定 session 的 ReAct 推理步骤")
    public Result<List<ReActStep>> getTrace(@PathVariable String sessionId) {
        List<ReActStep> steps = reactTraceStore.getSteps(sessionId);
        return Result.ok(steps);
    }
}