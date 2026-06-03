package com.concert.agent;

import com.concert.config.ChatMemoryStore;
import com.concert.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * 演唱会总控Agent - 整合三个方向：
 * 方向一：AI陪看伙伴（长期记忆、主动提醒、应援合照）
 * 方向二：歌手数字分身（歌手对话 + RAG）
 * 方向三：动态决策引擎（行程规划 + 实时天气/路况）
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ConcertOrchestratorAgent {

    private final ChatClient chatClient;
    private final ConcertContextHolder contextHolder;
    private final ChatMemoryStore chatMemoryStore;
    private final LongTermMemoryService memoryService;
    private final ActiveReminderScheduler reminderScheduler;

    // 三个方向的服务
    private final CelebrityAgentService celebrityService;
    private final MusicAgentService musicService;
    private final PlanningAgentService planningService;

    /**
     * 统一入口：处理所有用户输入
     */
    public String process(String sessionId, Long userId, String input) {
        log.info("Orchestrator收到: sessionId={}, userId={}, input={}", sessionId, userId, input);

        // 加载会话
        UserSession session = contextHolder.getSession(sessionId);
        if (userId != null) {
            session.setUserId(userId);
        }

        // 1. 主动提醒检查（方向一）
        if (userId != null && Boolean.TRUE.equals(session.getReminderEnabled())) {
            String reminder = reminderScheduler.pollReminder(userId);
            if (reminder != null) {
                // 推送提醒后继续处理用户输入
                return reminder + "\n\n" + handleInput(session, input);
            }
        }

        // 2. 处理用户输入
        String response = handleInput(session, input);

        // 3. 保存对话历史到内存/Redis
        chatMemoryStore.saveMessages(sessionId, List.of(
                new ChatMemoryStore.Message("user", input),
                new ChatMemoryStore.Message("assistant", response)
        ));

        // 4. 异步更新长期记忆（方向一核心）
        if (userId != null) {
            List<ChatMemoryStore.Message> recent = chatMemoryStore.getMessages(sessionId);
            memoryService.updateMemory(userId, recent);
        }

        // 5. 保存会话上下文
        contextHolder.saveSession(session);

        // 6. 主动推荐其他功能（方向一/二/三联动）
        response = appendProactiveSuggestion(response, session, input);

        return response;
    }

    /**
     * 意图识别与路由
     */
    private String handleInput(UserSession session, String input) {
        String intent = classifyIntent(input);
        log.info("意图分类: {} -> {}", input, intent);

        switch (intent) {
            case "celebrity_chat":
                return handleCelebrityChat(session, input);
            case "music_radio":
                return handleMusic(session, input);
            case "planning":
                return handlePlanning(session, input);
            case "souvenir":
                return handleSouvenir(session, input);
            default:
                return handleGeneral(session, input);
        }
    }

    // ========== 各方向具体实现 ==========

    /**
     * 方向二：歌手对话（增强版，已包含RAG知识库）
     */
    private String handleCelebrityChat(UserSession session, String input) {
        String singer = extractSingerFromInput(input);
        if (singer == null) {
            singer = session.getSelectedSinger();
            if (singer == null) {
                return "想和哪位歌手聊天呢？可以说'我想和周杰伦聊聊'～";
            }
        } else {
            session.setSelectedSinger(singer);
        }

        String celebSessionId = session.getCelebrityChatSessionId();
        if (celebSessionId == null) {
            celebSessionId = "celeb_" + session.getSessionId();
            session.setCelebrityChatSessionId(celebSessionId);
        }

        // 调用增强版歌手对话服务
        return celebrityService.chat(celebSessionId, singer, input);
    }

    /**
     * 方向二：音乐/电台推荐
     */
    private String handleMusic(UserSession session, String input) {
        Map<String, Object> result = musicService.recommend(input);
        StringBuilder sb = new StringBuilder();
        if ("singer".equals(result.get("type"))) {
            sb.append("🎵 ").append(result.get("singer")).append("的热门歌曲：\n\n");
        } else {
            sb.append("🎶 ").append(result.get("message")).append("\n\n");
        }
        List<Map<String, String>> songs = (List<Map<String, String>>) result.get("songs");
        if (songs != null) {
            for (int i = 0; i < Math.min(songs.size(), 5); i++) {
                Map<String, String> song = songs.get(i);
                sb.append(String.format("%d. %s - %s\n", i+1, song.get("name"), song.get("artist")));
            }
        }
        return sb.toString();
    }

    /**
     * 方向三：动态行程规划（支持实时天气/路况异常处理）
     */
    private String handlePlanning(UserSession session, String input) {
        // 从输入中提取关键信息，更新会话
        String singer = extractSingerFromInput(input);
        if (singer != null) session.setSelectedSinger(singer);
        // 可进一步提取城市、日期等（略）

        // 调用增强版规划服务（内部已集成实时天气/路况）
        return planningService.planConcertTrip(session, input);
    }

    /**
     * 方向一：生成纪念卡片
     */
    private String handleSouvenir(UserSession session, String input) {
        if (session.getSelectedSinger() == null) {
            return "请先告诉我你喜欢的歌手，然后我帮你生成纪念卡片～";
        }
        String memory = memoryService.getUserMemory(session.getUserId());
        String prompt = String.format(
                "为看完%s演唱会的粉丝写一段80字纪念文字。用户记忆：%s，用户留言：%s",
                session.getSelectedSinger(), memory, input
        );
        String message = chatClient.prompt().user(prompt).call().content();
        return "🎫 **演唱会纪念卡片**\n\n" + message + "\n\n---\n💝 长按保存这份专属回忆～";
    }

    /**
     * 通用对话 + 长期记忆注入 + 主动推荐
     */
    private String handleGeneral(UserSession session, String input) {
        // 获取长期记忆
        String memory = (session.getUserId() == null) ? "" : memoryService.getUserMemory(session.getUserId());

        String systemPrompt = String.format(
                "你是顶级演唱会管家'小演'，同时也是用户的专属演唱会陪看伙伴。你有长期记忆，能记住用户之前的偏好和对话。\n\n" +
                        "## 用户长期记忆摘要\n%s\n\n" +
                        "## 当前会话信息\n- 已选歌手：%s\n- 演唱会城市：%s\n- 出发城市：%s\n- 行程天数：%s\n- 预算：%s\n- 心情：%s\n- 用户偏好：%s\n\n" +
                        "## 行为准则\n1. 结合长期记忆，主动提及用户之前说过的事，比如'你上次说喜欢周杰伦的晴天，这次我给你推荐他的现场版'\n" +
                        "2. 如果演唱会临近（3天内），主动提醒准备事项\n" +
                        "3. 语气温暖、有陪伴感，可以称呼用户为'小伙伴'\n" +
                        "4. 回复中可以主动推荐'生成应援合照'、'录制晚安语音'、'定制回忆卡片'\n" +
                        "5. 用 [思考] 标签展示推理过程\n" +
                        "6. 可主动推荐附近粉丝、歌手对话、电台等",
                memory,
                nullSafe(session.getSelectedSinger()),
                nullSafe(session.getConcertCity()),
                nullSafe(session.getDepartureCity()),
                session.getTripDays() != null ? session.getTripDays() + "天" : "未指定",
                nullSafe(session.getBudgetLevel()),
                nullSafe(session.getMood()),
                session.getPreferences() != null ? String.join("、", session.getPreferences()) : "无"
        );

        String response = chatClient.prompt()
                .system(systemPrompt)
                .user(input)
                .call()
                .content();

        return response;
    }

    /**
     * 主动推荐其他功能（基于当前会话状态）
     */
    private String appendProactiveSuggestion(String response, UserSession session, String input) {
        // 如果用户刚问完歌手，没提规划/电台，则主动推荐
        if (session.getSelectedSinger() != null &&
                !input.contains("规划") && !input.contains("电台")) {
            response += "\n\n---\n💡 **你可能还想：**\n" +
                    "• 🎤 和" + session.getSelectedSinger() + "聊天\n" +
                    "• 🚗 规划演唱会行程";
        }
        return response;
    }

    // ========== 工具方法 ==========

    private String classifyIntent(String input) {
        if (input.contains("聊") || input.contains("说话") || (input.contains("你好") && containsSinger(input))) {
            return "celebrity_chat";
        }
        if (input.contains("歌") || input.contains("听") || input.contains("电台") || input.contains("推荐")) {
            return "music_radio";
        }
        if (input.contains("行程") || input.contains("规划") || input.contains("交通") ||
                input.contains("酒店") || input.contains("怎么去") || input.contains("天气")) {
            return "planning";
        }
        if (input.contains("纪念") || input.contains("卡片") || input.contains("回忆")) {
            return "souvenir";
        }
        return "general";
    }

    private boolean containsSinger(String input) {
        String[] singers = {"周杰伦", "林俊杰", "五月天", "邓紫棋", "薛之谦", "陈奕迅", "张杰", "李荣浩", "毛不易", "汪苏泷"};
        for (String s : singers) {
            if (input.contains(s)) return true;
        }
        return false;
    }

    private String extractSingerFromInput(String input) {
        String[] singers = {"周杰伦", "林俊杰", "五月天", "邓紫棋", "薛之谦", "陈奕迅", "张杰", "李荣浩", "毛不易", "汪苏泷"};
        for (String s : singers) {
            if (input.contains(s)) return s;
        }
        return null;
    }

    private String nullSafe(String s) {
        return s != null && !s.isEmpty() ? s : "未指定";
    }
}