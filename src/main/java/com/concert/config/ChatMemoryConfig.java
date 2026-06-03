package com.concert.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;

/**
 * 会话存储配置。
 *
 * 默认（无 Redis 配置）使用内存存储；
 * application.yml 中 spring.data.redis.enabled=true 时使用 Redis 存储。
 */
@Configuration
public class ChatMemoryConfig {

    @Bean
    @ConditionalOnProperty(name = "spring.data.redis.enabled", havingValue = "true")
    public ChatMemoryStore chatMemoryStore(StringRedisTemplate redisTemplate) {
        return new RedisChatMemoryStoreImpl(redisTemplate);
    }

    @Bean
    @ConditionalOnProperty(name = "spring.data.redis.enabled", havingValue = "false", matchIfMissing = true)
    public ChatMemoryStore inMemoryChatMemoryStore() {
        return new InMemoryChatMemoryStore();
    }
}
