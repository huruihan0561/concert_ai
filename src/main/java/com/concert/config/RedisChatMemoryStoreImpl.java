package com.concert.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import java.util.ArrayList;
import java.util.List;
import com.alibaba.fastjson2.JSON;

@Component
@ConditionalOnProperty(name = "spring.data.redis.enabled", havingValue = "true")
public class RedisChatMemoryStoreImpl implements ChatMemoryStore {
    private final StringRedisTemplate redisTemplate;
    private static final String KEY_PREFIX = "chat:session:";
    public RedisChatMemoryStoreImpl(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }
    @Override
    public void saveMessages(String sessionId, List<Message> messages) {
        List<Message> existing = getMessages(sessionId);
        existing.addAll(messages);
        redisTemplate.opsForValue().set(KEY_PREFIX + sessionId, JSON.toJSONString(existing));
    }
    @Override
    public List<Message> getMessages(String sessionId) {
        String json = redisTemplate.opsForValue().get(KEY_PREFIX + sessionId);
        if (json == null) return new ArrayList<>();
        return JSON.parseArray(json, Message.class);
    }
    @Override
    public void clearMessages(String sessionId) {
        redisTemplate.delete(KEY_PREFIX + sessionId);
    }
}