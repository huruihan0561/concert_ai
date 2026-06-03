package com.concert.config;

import java.util.List;

public interface ChatMemoryStore {
    class Message {
        private String role;
        private String content;
        public Message() {}
        public Message(String role, String content) {
            this.role = role;
            this.content = content;
        }
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
    }
    void saveMessages(String sessionId, List<Message> messages);
    List<Message> getMessages(String sessionId);
    void clearMessages(String sessionId);
}