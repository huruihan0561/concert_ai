package com.concert.agent;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import java.util.concurrent.TimeUnit;

@Component
@Slf4j
public class ConcertContextHolder {

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private static final String SESSION_PREFIX = "orch:session:";
    private static final long TTL_HOURS = 72;

    public ConcertContextHolder(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public void saveSession(UserSession session) {
        try {
            String json = objectMapper.writeValueAsString(session);
            redisTemplate.opsForValue().set(SESSION_PREFIX + session.getSessionId(), json, TTL_HOURS, TimeUnit.HOURS);
        } catch (Exception e) { log.error("保存会话失败", e); }
    }

    public UserSession getSession(String sessionId) {
        String json = redisTemplate.opsForValue().get(SESSION_PREFIX + sessionId);
        if (json == null) {
            UserSession session = new UserSession();
            session.setSessionId(sessionId);
            return session;
        }
        try {
            return objectMapper.readValue(json, UserSession.class);
        } catch (Exception e) {
            return new UserSession();
        }
    }

    public void clearSession(String sessionId) {
        redisTemplate.delete(SESSION_PREFIX + sessionId);
    }

    public void registerFan(String singer, String city, String userId) {
        String key = "orch:fans:" + singer + ":" + city;
        redisTemplate.opsForSet().add(key, userId);
        redisTemplate.expire(key, 30, TimeUnit.DAYS);
    }
}