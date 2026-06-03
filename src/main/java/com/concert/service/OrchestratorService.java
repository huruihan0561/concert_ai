package com.concert.service;

import java.util.Map;

public interface OrchestratorService {

    Map<String, Object> chat(String sessionId, Long userId, String input) throws Exception;
}