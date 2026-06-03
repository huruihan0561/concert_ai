package com.concert.agent;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class LongTermMemoryService {
    private final StringRedisTemplate redisTemplate;
    private final ChatClient chatClient;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private static final String KEY_PREFIX = "memory:user:";
    private static final long TTL_DAYS = 90;

    public String getUserMemory(Long userId) {
        if (userId == null) return "新用户";
        String json = redisTemplate.opsForValue().get(KEY_PREFIX + userId);
        if (json == null) return "暂无历史记忆";
        try {
            MemoryData data = objectMapper.readValue(json, MemoryData.class);
            return data.summary;
        } catch (Exception e) { return "记忆加载失败"; }
    }

    public void updateMemory(Long userId, List<com.concert.config.ChatMemoryStore.Message> messages) {
        if (userId == null || messages == null || messages.isEmpty()) return;
        String old = getUserMemory(userId);
        StringBuilder sb = new StringBuilder();
        for (var m : messages) sb.append(m.getRole()).append(": ").append(m.getContent()).append("\n");
        String prompt = String.format("旧记忆：%s\n新对话：%s\n生成更新后的用户记忆摘要：", old, sb);
        String newSummary = chatClient.prompt().user(prompt).call().content();
        try {
            MemoryData data = new MemoryData(newSummary, LocalDateTime.now());
            redisTemplate.opsForValue().set(KEY_PREFIX + userId, objectMapper.writeValueAsString(data), TTL_DAYS, TimeUnit.DAYS);
        } catch (Exception e) { log.error("保存记忆失败", e); }
    }

    record MemoryData(String summary, LocalDateTime updateTime) {}
}