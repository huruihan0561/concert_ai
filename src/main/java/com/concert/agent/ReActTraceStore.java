package com.concert.agent;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * ReAct 推理链路存储服务（Redis）
 * 每个 session 的推理链路独立存储，TTL 为 10 分钟
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ReActTraceStore {

    private final StringRedisTemplate redisTemplate;

    private static final String KEY_PREFIX = "react_trace:";
    private static final long TTL_MINUTES = 10;

    /**
     * 保存一条推理步骤
     */
    public void appendStep(String sessionId, ReActStep step) {
        String key = KEY_PREFIX + sessionId;
        String stepJson = toJson(step);
        redisTemplate.opsForList().rightPush(key, stepJson);
        redisTemplate.expire(key, TTL_MINUTES, TimeUnit.MINUTES);
        log.debug("保存推理步骤: sessionId={}, step={}", sessionId, step.getStep());
    }

    /**
     * 获取某 session 的所有推理步骤
     */
    public List<ReActStep> getSteps(String sessionId) {
        String key = KEY_PREFIX + sessionId;
        List<String> raw = redisTemplate.opsForList().range(key, 0, -1);
        if (raw == null || raw.isEmpty()) {
            return Collections.emptyList();
        }
        List<ReActStep> steps = new ArrayList<>();
        for (String item : raw) {
            try {
                steps.add(fromJson(item));
            } catch (Exception e) {
                log.warn("解析推理步骤失败: {}", item, e);
            }
        }
        return steps;
    }

    /**
     * 清空某 session 的推理链路
     */
    public void clear(String sessionId) {
        String key = KEY_PREFIX + sessionId;
        redisTemplate.delete(key);
    }

    /**
     * 将步骤标记为已完成（将 active 置为 false）
     */
    public void finishStep(String sessionId, int stepIndex) {
        String key = KEY_PREFIX + sessionId;
        List<String> raw = redisTemplate.opsForList().range(key, 0, -1);
        if (raw == null || stepIndex >= raw.size()) return;

        ReActStep step = fromJson(raw.get(stepIndex));
        step.setActive(false);
        redisTemplate.opsForList().set(key, stepIndex, toJson(step));
    }

    // ---- 简单 JSON 序列化（避免引入额外依赖） ----

    private String toJson(ReActStep s) {
        StringBuilder sb = new StringBuilder("{");
        sb.append("\"step\":").append(s.getStep()).append(",");
        sb.append("\"type\":\"").append(escape(s.getType())).append("\",");
        sb.append("\"description\":\"").append(escape(s.getDescription() != null ? s.getDescription() : "")).append("\",");
        sb.append("\"toolName\":\"").append(escape(s.getToolName() != null ? s.getToolName() : "")).append("\",");
        sb.append("\"toolArgs\":\"").append(escape(s.getToolArgs() != null ? s.getToolArgs() : "")).append("\",");
        sb.append("\"toolResult\":\"").append(escape(s.getToolResult() != null ? s.getToolResult() : "")).append("\",");
        sb.append("\"rawText\":\"").append(escape(s.getRawText() != null ? s.getRawText() : "")).append("\",");
        sb.append("\"timestamp\":").append(s.getTimestamp()).append(",");
        sb.append("\"active\":").append(s.isActive());
        sb.append("}");
        return sb.toString();
    }

    private ReActStep fromJson(String json) {
        ReActStep.ReActStepBuilder b = ReActStep.builder();
        json = json.trim();
        if (json.startsWith("{")) json = json.substring(1);
        if (json.endsWith("}")) json = json.substring(0, json.length() - 1);
        String[] pairs = json.split(",");
        for (String pair : pairs) {
            String[] kv = pair.split(":", 2);
            if (kv.length < 2) continue;
            String k = kv[0].trim();
            String v = kv[1].trim();
            // 去掉首尾引号
            if (v.startsWith("\"")) v = v.substring(1);
            if (v.endsWith("\"")) v = v.substring(0, v.length() - 1);
            k = k.replace("\"", "");
            v = unescape(v);
            switch (k) {
                case "step" -> b.step(Integer.parseInt(v));
                case "type" -> b.type(v);
                case "description" -> b.description(v);
                case "toolName" -> b.toolName(v.isEmpty() ? null : v);
                case "toolArgs" -> b.toolArgs(v.isEmpty() ? null : v);
                case "toolResult" -> b.toolResult(v.isEmpty() ? null : v);
                case "rawText" -> b.rawText(v.isEmpty() ? null : v);
                case "timestamp" -> b.timestamp(Long.parseLong(v));
                case "active" -> b.active("true".equals(v));
            }
        }
        return b.build();
    }

    private String escape(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    private String unescape(String s) {
        if (s == null) return "";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c == '\\' && i + 1 < s.length()) {
                char n = s.charAt(++i);
                switch (n) {
                    case 'n' -> sb.append('\n');
                    case 'r' -> sb.append('\r');
                    case 't' -> sb.append('\t');
                    case '"' -> sb.append('"');
                    case '\\' -> sb.append('\\');
                    default -> { sb.append('\\'); sb.append(n); }
                }
            } else {
                sb.append(c);
            }
        }
        return sb.toString();
    }
}
