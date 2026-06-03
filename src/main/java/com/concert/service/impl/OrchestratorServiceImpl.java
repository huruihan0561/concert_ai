package com.concert.service.impl;

import com.concert.service.OrchestratorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrchestratorServiceImpl implements OrchestratorService {

    @Override
    public Map<String, Object> chat(String sessionId, Long userId, String input) throws Exception {
        throw new UnsupportedOperationException("chat 方法尚未实现");
    }
}
