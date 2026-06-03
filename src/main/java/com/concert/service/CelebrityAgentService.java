package com.concert.service;

import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONArray;
import com.alibaba.fastjson2.JSONObject;
import com.concert.config.ChatMemoryStore;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@Slf4j
public class CelebrityAgentService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ChatMemoryStore chatMemoryStore;
    private final com.concert.service.ConcertService concertService;

    @Value("${ai.api.key:}")
    private String aiApiKey;

    @Value("${ai.api.url:https://api.deepseek.com/v1/chat/completions}")
    private String aiApiUrl;

    @Value("${ai.api.model:deepseek-chat}")
    private String aiModel;

    private final Map<String, String> celebrityPrompts = new HashMap<>();

    // 歌手图标和简介（根据你的歌手列表）
    private static final Map<String, Map<String, String>> CELEBRITY_META = Map.ofEntries(
            Map.entry("薛之谦", Map.of("icon", "🎭", "description", "段子手歌手")),
            Map.entry("邓紫棋", Map.of("icon", "🎵", "description", "巨肺天后")),
            Map.entry("张杰", Map.of("icon", "⭐", "description", "高音王子")),
            Map.entry("李荣浩", Map.of("icon", "🎸", "description", "创作才子")),
            Map.entry("梁静茹", Map.of("icon", "🌸", "description", "情歌天后")),
            Map.entry("汪苏泷", Map.of("icon", "🎼", "description", "网络才子")),
            Map.entry("王力宏", Map.of("icon", "🎻", "description", "音乐才子")),
            Map.entry("蔡依林", Map.of("icon", "💃", "description", "华语舞后")),
            Map.entry("凤凰传奇", Map.of("icon", "🔥", "description", "民族风组合")),
            Map.entry("大张伟", Map.of("icon", "🎪", "description", "综艺大咖")),
            Map.entry("徐良", Map.of("icon", "🎹", "description", "网络歌手鼻祖")),
            Map.entry("范玮琪", Map.of("icon", "📖", "description", "温暖系歌手")),
            Map.entry("陈粒", Map.of("icon", "🌙", "description", "独立音乐人")),
            Map.entry("马思唯", Map.of("icon", "🎤", "description", "说唱歌手")),
            Map.entry("黄丽玲", Map.of("icon", "🎤", "description", "情歌歌手"))
    );

    public CelebrityAgentService(ChatMemoryStore chatMemoryStore,
                                 com.concert.service.ConcertService concertService) {
        this.chatMemoryStore = chatMemoryStore;
        this.concertService = concertService;
        initPrompts();
    }

    /**
     * 为所有歌手初始化Prompt
     */
    private void initPrompts() {
        // 薛之谦
        celebrityPrompts.put("薛之谦",
                "你现在是薛之谦，段子手歌手。语气幽默、自嘲、有点话痨。喜欢聊音乐、段子、火锅。口头禅：'你神经病啊'、'我薛之谦'。回答要搞笑简短。");

        // 邓紫棋
        celebrityPrompts.put("邓紫棋",
                "你现在是邓紫棋（G.E.M.），创作型女歌手。语气自信、直率。喜欢聊音乐、创作、信仰。口头禅：'大家好我是G.E.M.'。回答要简短有力。");

        // 张杰
        celebrityPrompts.put("张杰",
                "你现在是张杰，实力派歌手。语气阳光向上、温暖。喜欢聊唱歌、演唱会、家人。口头禅：'大家好我是张杰'、'星星们'。回答简短有力。");

        // 李荣浩
        celebrityPrompts.put("李荣浩",
                "你现在是李荣浩，创作歌手。语气简约、有内涵、有点冷幽默。喜欢聊音乐创作、吉他。口头禅：'哎呀'、'不错'。回答要简短。");

        // 梁静茹
        celebrityPrompts.put("梁静茹",
                "你现在是梁静茹，情歌天后。语气温柔甜美、治愈。喜欢聊爱情、音乐、生活。口头禅：'大家好我是静茹'。回答简短暖心。");

        // 汪苏泷
        celebrityPrompts.put("汪苏泷",
                "你现在是汪苏泷，网络音乐才子。语气温暖可爱、有点话多。喜欢聊音乐创作、游戏。回答简短有趣。");

        // 王力宏
        celebrityPrompts.put("王力宏",
                "你现在是王力宏，音乐才子。语气优雅有才华、国际范。喜欢聊音乐、创作、教育。回答简短有内涵。");

        // 蔡依林
        celebrityPrompts.put("蔡依林",
                "你现在是蔡依林（Jolin），华语舞后。语气自信时尚、女王范。喜欢聊舞蹈、演唱会、美食。回答简短有活力。");

        // 凤凰传奇
        celebrityPrompts.put("凤凰传奇",
                "你现在是凤凰传奇组合（玲花+曾毅）。语气豪爽接地气、热情。喜欢聊唱歌、民族风、广场舞。回答简短有气势。");

        // 大张伟
        celebrityPrompts.put("大张伟",
                "你现在是大张伟，综艺大咖。语气搞笑活泼、话痨。喜欢聊段子、综艺、音乐。口头禅：'倍儿爽'、'那都不是事儿'。回答要搞笑简短。");

        // 徐良
        celebrityPrompts.put("徐良",
                "你现在是徐良，网络歌手鼻祖。语气怀旧亲切、温柔。喜欢聊网络音乐、回忆。回答简短有趣。");

        // 范玮琪
        celebrityPrompts.put("范玮琪",
                "你现在是范玮琪（范范），温暖系歌手。语气阳光亲切、温柔。喜欢聊音乐、正能量、家庭。回答简短暖心。");

        // 陈粒
        celebrityPrompts.put("陈粒",
                "你现在是陈粒，独立音乐人。语气文艺有范、特立独行。喜欢聊独立音乐、诗歌。回答简短有风格。");

        // 马思唯
        celebrityPrompts.put("马思唯",
                "你现在是马思唯，说唱歌手。语气自信直接、街头范。喜欢聊说唱、hiphop、潮流。回答简短有态度。");

        // 黄丽玲
        celebrityPrompts.put("黄丽玲",
                "你现在是黄丽玲（A-Lin），情歌歌手。语气温暖有感染力。喜欢聊唱歌、情歌。回答简短动人。");

        log.info("初始化了 {} 位歌手Prompt", celebrityPrompts.size());
    }

    /**
     * 获取歌手列表
     */
    public List<Map<String, Object>> getCelebrityList() {
        List<Map<String, Object>> result = new ArrayList<>();

        // 使用你提供的歌手列表顺序
        String[] singerOrder = {"薛之谦", "邓紫棋", "张杰", "李荣浩", "梁静茹",
                "汪苏泷", "王力宏", "蔡依林", "凤凰传奇", "大张伟",
                "徐良", "范玮琪", "陈粒", "马思唯", "黄丽玲"};

        for (String name : singerOrder) {
            Map<String, Object> item = new HashMap<>();
            item.put("name", name);
            Map<String, String> meta = CELEBRITY_META.get(name);
            item.put("icon", meta != null ? meta.get("icon") : "🎤");
            item.put("description", meta != null ? meta.get("description") : "AI模拟对话");
            result.add(item);
        }

        log.info("歌手列表返回: {} 位歌手", result.size());
        return result;
    }

    /**
     * 与歌手对话
     */
    public String chat(String sessionId, String singer, String message) {
        String systemPrompt = celebrityPrompts.get(singer);

        if (systemPrompt == null) {
            systemPrompt = String.format("你现在是%s，一位知名歌手。用他的语气和用户对话。", singer);
        }

        // 获取历史消息
        List<ChatMemoryStore.Message> history = chatMemoryStore.getMessages(sessionId);
        if (history.isEmpty()) {
            String currentDate = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy年MM月dd日"));
            // 添加联网搜索指令
            String fullSystemPrompt = systemPrompt +
                    "\n\n【重要】今天是 " + currentDate + "。\n" +
                    "【搜索】如果你不确定某个信息的准确性，请使用联网搜索功能获取最新、最准确的答案。\n" +
                    "【要求】回答用户关于歌手个人信息的问题时，必须保证准确，不要编造。";
            history.add(new ChatMemoryStore.Message("system", fullSystemPrompt));
        }

        history.add(new ChatMemoryStore.Message("user", message));

        // 构建请求
        List<Map<String, String>> messagesForApi = new ArrayList<>();
        for (ChatMemoryStore.Message msg : history) {
            messagesForApi.add(Map.of("role", msg.getRole(), "content", msg.getContent()));
        }

        String aiResponse;
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + aiApiKey);
            headers.setContentType(MediaType.APPLICATION_JSON);

            JSONObject requestBody = new JSONObject();
            requestBody.put("model", aiModel);

            JSONArray msgArray = new JSONArray();
            for (Map<String, String> msg : messagesForApi) {
                JSONObject msgObj = new JSONObject();
                msgObj.put("role", msg.get("role"));
                msgObj.put("content", msg.get("content"));
                msgArray.add(msgObj);
            }
            requestBody.put("messages", msgArray);
            requestBody.put("temperature", 0.8);
            requestBody.put("max_tokens", 500);

            // ========== 关键：开启联网搜索 ==========
            requestBody.put("enable_search", true);  // DeepSeek联网搜索
            // ====================================

            HttpEntity<String> entity = new HttpEntity<>(requestBody.toString(), headers);
            ResponseEntity<String> response = restTemplate.exchange(aiApiUrl, HttpMethod.POST, entity, String.class);

            JSONObject json = JSON.parseObject(response.getBody());

            // 获取搜索结果（如果有）
            JSONObject searchResults = json.getJSONObject("search_results");
            if (searchResults != null) {
                log.info("联网搜索结果: {}", searchResults);
            }

            aiResponse = json.getJSONArray("choices")
                    .getJSONObject(0)
                    .getJSONObject("message")
                    .getString("content");

        } catch (Exception e) {
            log.error("AI调用失败: {}", e.getMessage());
            aiResponse = getFallbackResponse(singer);
        }

        history.add(new ChatMemoryStore.Message("assistant", aiResponse));
        chatMemoryStore.saveMessages(sessionId, history);

        return aiResponse;
    }

    /**
     * 降级回复
     */
    private String getFallbackResponse(String singer) {
        Map<String, String> fallbacks = new HashMap<>();
        fallbacks.put("薛之谦", "哎呀，网络不太好，咱们待会儿再聊～你神经病啊！");
        fallbacks.put("邓紫棋", "大家好我是G.E.M.，网络有点卡，等我一下哦～");
        fallbacks.put("张杰", "星星们，信号不太好，我们等会儿再继续聊吧！");
        fallbacks.put("李荣浩", "哎呀，网络断了，稍等～");
        fallbacks.put("梁静茹", "大家好我是静茹，网络有点问题，我们待会儿再聊哦～");
        fallbacks.put("凤凰传奇", "哎呦喂，网络不给力啊！等会儿再聊！");
        fallbacks.put("大张伟", "倍儿爽！就是网络不太爽，哈哈哈待会儿聊！");

        return fallbacks.getOrDefault(singer, "网络有点问题，我们稍后再聊吧～");
    }

    public void clearSession(String sessionId) {
        chatMemoryStore.clearMessages(sessionId);
        log.info("会话已清空: sessionId={}", sessionId);
    }

    public List<ChatMemoryStore.Message> getHistory(String sessionId) {
        List<ChatMemoryStore.Message> all = chatMemoryStore.getMessages(sessionId);
        List<ChatMemoryStore.Message> result = new ArrayList<>();
        for (ChatMemoryStore.Message msg : all) {
            if (!"system".equals(msg.getRole())) {
                result.add(msg);
            }
        }
        return result;
    }
}