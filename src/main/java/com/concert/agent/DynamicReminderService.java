package com.concert.agent;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class DynamicReminderService {

    private final StringRedisTemplate redisTemplate;
    private static final String KEY_PREFIX = "reminder:user:";

    public void createReminder(String userId, String message) {
        String key = KEY_PREFIX + userId;
        String value = message + "|" + System.currentTimeMillis();
        redisTemplate.opsForList().rightPush(key, value);
        redisTemplate.expire(key, 7, TimeUnit.DAYS);
    }

    public String pollReminder(String userId) {
        String key = KEY_PREFIX + userId;
        String item = redisTemplate.opsForList().leftPop(key);
        if (item == null) return null;
        return item.split("\\|")[0];
    }

    public void clearReminders(String userId) {
        redisTemplate.delete(KEY_PREFIX + userId);
    }
}