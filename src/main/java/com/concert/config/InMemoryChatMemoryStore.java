package com.concert.config;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class InMemoryChatMemoryStore implements ChatMemoryStore {
    private final Map<String, List<Message>> store = new ConcurrentHashMap<>();
    @Override
    public void saveMessages(String sessionId, List<Message> messages) {
        store.put(sessionId, new ArrayList<>(messages));
    }
    @Override
    public List<Message> getMessages(String sessionId) {
        return store.getOrDefault(sessionId, new ArrayList<>());
    }
    @Override
    public void clearMessages(String sessionId) {
        store.remove(sessionId);
    }
}