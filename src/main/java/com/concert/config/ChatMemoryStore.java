package com.concert.config;

import java.util.List;
import java.util.Map;

public interface ChatMemoryStore {
    class Message {
        private String role;
        private String content;
        private String identity;  // 身份信息，如"汪苏泷粉丝"
        private Long concertId;   // 演唱会ID
        private Map<String, Object> metadata;  // 额外元数据
        private Long timestamp;   // 时间戳

        public Message() {
            this.timestamp = System.currentTimeMillis();
        }

        public Message(String role, String content) {
            this();
            this.role = role;
            this.content = content;
        }

        public Message(String role, String content, String identity, Long concertId) {
            this(role, content);
            this.identity = identity;
            this.concertId = concertId;
        }

        // Getters and Setters
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
        public String getIdentity() { return identity; }
        public void setIdentity(String identity) { this.identity = identity; }
        public Long getConcertId() { return concertId; }
        public void setConcertId(Long concertId) { this.concertId = concertId; }
        public Map<String, Object> getMetadata() { return metadata; }
        public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }
        public Long getTimestamp() { return timestamp; }
        public void setTimestamp(Long timestamp) { this.timestamp = timestamp; }
    }

    void saveMessages(String sessionId, List<Message> messages);
    List<Message> getMessages(String sessionId);
    void clearMessages(String sessionId);
}