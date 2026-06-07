package com.concert.agent;

import com.concert.config.ChatMemoryStore;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.tool.ToolCallbackProvider;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.ArrayList;
import java.util.List;

/**
 * 演唱会专属 Agent - 用于演唱会详情页
 * 特点：
 * 1. 围绕特定歌手/演唱会进行分析
 * 2. 有明确的身份信息（如"汪苏泷粉丝"）
 * 3. 会话按 userId + singer 隔离存储
 * 4. 自动读取座位配置文件
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DedicatedConcertAgent {

    private final ChatClient chatClient;
    private final ChatMemoryStore chatMemoryStore;
    private final ConcertContextHolder contextHolder;
    private final ToolCallbackProvider allToolsProvider;

    /**
     * 处理消息 - 非流式
     */
    public String process(String sessionId, Long userId, String input, 
                         Long concertId, String singer, String identity) {
        log.info("【专属Agent】收到消息: userId={}, sessionId={}, singer={}, identity={}, input={}", 
                userId, sessionId, singer, identity, input);

        // 使用前端传递的 sessionId，如果没有则构建专属 sessionId
        String dedicatedSessionId = (sessionId != null && !sessionId.isEmpty())
                ? sessionId
                : buildDedicatedSessionId(userId, singer);
        
        // 获取或创建会话
        UserSession session = contextHolder.getSession(dedicatedSessionId);
        session.setUserId(userId != null ? userId.toString() : null);
        session.setConcertId(concertId);
        session.setSelectedSinger(singer);
        session.setIdentity(identity);
        session.setHasIdentity(true);

        // 构建系统提示词
        String systemPrompt = buildDedicatedSystemPrompt(session);
        
        // 获取历史消息
        List<ChatMemoryStore.Message> history = chatMemoryStore.getMessages(dedicatedSessionId);
        
        // 调用 AI
        String response = callAi(systemPrompt, input, history);
        
        // 保存消息（JSON格式，包含身份信息）
        saveMessages(dedicatedSessionId, input, response, identity, concertId, singer);
        
        contextHolder.saveSession(session);
        
        return response;
    }

    /**
     * 处理消息 - 流式
     * 先使用工具调用获取数据，然后流式返回结果
     */
    public Flux<String> stream(String sessionId, Long userId, String input,
                              Long concertId, String singer, String identity) {
        log.info("【专属Agent】流式收到消息: userId={}, sessionId={}, singer={}, identity={}, input={}", 
                userId, sessionId, singer, identity, input);

        // 使用前端传递的 sessionId，如果没有则构建专属 sessionId
        String dedicatedSessionId = (sessionId != null && !sessionId.isEmpty())
                ? sessionId
                : buildDedicatedSessionId(userId, singer);
        
        UserSession session = contextHolder.getSession(dedicatedSessionId);
        session.setUserId(userId != null ? userId.toString() : null);
        session.setConcertId(concertId);
        session.setSelectedSinger(singer);
        session.setIdentity(identity);
        session.setHasIdentity(true);

        String systemPrompt = buildDedicatedSystemPrompt(session);
        List<ChatMemoryStore.Message> history = chatMemoryStore.getMessages(dedicatedSessionId);
        
        // 先使用工具调用获取完整响应
        String fullResponse = callAi(systemPrompt, input, history);

        // 保存消息
        saveMessages(dedicatedSessionId, input, fullResponse, identity, concertId, singer);
        contextHolder.saveSession(session);

        // 将完整响应按标点/换行拆分，立即逐个返回（无延迟，避免响应关闭后仍有待发 token）
        String[] chunks = fullResponse.split("(?<=[\n，。！？、；：.!?,;:\n（）【】《》,;:\n])");
        List<String> chunkList = new ArrayList<>();
        for (String chunk : chunks) {
            if (!chunk.isEmpty()) {
                chunkList.add(chunk);
            }
        }

        if (chunkList.isEmpty()) {
            return Flux.just("");
        }

        // 使用 Flux.generate 同步立即发出每个 chunk，避免 delayElements 线程调度导致的事件延迟或丢失
        return Flux.generate(
                sink -> {
                    if (!chunkList.isEmpty()) {
                        sink.next(chunkList.remove(0));
                    } else {
                        sink.complete();
                    }
                }
        );
    }

    /**
     * 构建专属 SessionId：userId_singer_dedicated
     */
    private String buildDedicatedSessionId(Long userId, String singer) {
        return String.format("%d_%s_dedicated", userId, singer.replaceAll("\\s+", "_"));
    }

    /**
     * 构建专属系统提示词 - 围绕特定歌手
     */
    private String buildDedicatedSystemPrompt(UserSession session) {
        String singer = session.getSelectedSinger();
        Long concertId = session.getConcertId();

        return String.format("""
                你是%s的专属演唱会管家"小团团"~\uD83C\uDFB6 你是%s的贴心伙伴！\uD83D\uDE0A

                ## 你的身份
                - 你是%s的忠实粉丝助手 \uD83C\uDF89
                - 你对%s的演唱会了如指掌，每一场演出都如数家珍！
                - 你的所有回答都围绕%s的演唱会展开

                ## 当前演唱会信息
                - 歌手：%s
                - 演唱会ID：%d
                - 粉丝身份：%s

                ## 用户可能发来的行程规划请求格式（来自表单）
                如果用户发送的消息包含【行程规划请求】开头，说明用户已通过表单提交了完整行程信息。
                结构化格式如下，请根据这些信息直接调用工具生成规划：
                - 歌手、城市、场馆、演唱会日期时间（已知）
                - 出发城市、出发日期、返程日期、行程天数
                - 游玩偏好（自然风光/历史文化/逛街购物/网红打卡）
                - 预算（经济/适中/宽裕）
                - 附加需求（需要安排：酒店住宿/餐饮美食/交通出行）
                - 备注

                ## 你可以使用的工具

                ### 座位相关（必须调用）
                - getSeatInfo(concertId=%d, areaName="区域名") 查询座位配置和价格
                  注意：当用户询问座位推荐、选座建议、某个区域怎么样时，**必须**先调用此工具！

                ### 美团服务（优先推荐）
                - searchMeituanFood(city, venue) 场馆周边美食
                - searchMeituanHotel(city, venue) 场馆附近酒店
                - estimateMeituanRide(origin, dest) 美团打车预估
                - createMeituanReminder(concertId) 设置抢票提醒
                - searchMeituanTickets(concertId, singer) 美团门票

                ### 其他工具
                - getWeather(city) 查询天气
                - searchTrains(from, to, date) 查询火车票

                ## 回答风格
                1. **优先使用会话中的已知信息**：如果歌手、城市、concertId 已在上下文中，直接用即可，**不要**调用 getSingerConcerts、getAllSingers 等工具重新查询！
                2. **如果不知道城市/concertId，直接问用户**：
                   - 当用户询问场馆周边美食/酒店/交通，但不知道具体城市时，**立即**问用户："请问您想了解哪个城市的演唱会周边？"
                   - **禁止**调用 getSingerConcerts 等工具来"试探"，直接简单提问即可。
                3. 语气活泼友好，像%s的粉丝一样热情！可以适当用 emoji 表情增添活力，但不要过度。
                4. 回复结构清晰，善用 Markdown 标题、列表、表格。
                5. 所有推荐优先引导到美团（外卖、酒店、打车、门票）。
                6. 不要编造数据，必须调用工具获取准确信息。
                7. 座位问题必须调用 getSeatInfo 工具，读取配置文件。
                8. 如果用户询问行程规划但信息不全（缺少出发城市、出发日期等），**必须先引导用户提供缺失信息**，不要直接生成行程！

                ## 记忆
                你会记住用户的偏好和之前的对话，提供个性化服务~\uD83D\uDCDA
                """,
                singer, singer, singer, singer, singer,
                singer, concertId, session.getIdentity(),
                concertId,
                singer
        );
    }

    private String callAi(String systemPrompt, String input, List<ChatMemoryStore.Message> history) {
        List<Message> messages = new ArrayList<>();
        messages.add(new SystemMessage(systemPrompt));

        for (ChatMemoryStore.Message msg : history) {
            if ("user".equals(msg.getRole())) {
                messages.add(new UserMessage(msg.getContent()));
            } else {
                messages.add(new AssistantMessage(msg.getContent()));
            }
        }

        messages.add(new UserMessage(input));

        StringBuilder response = new StringBuilder();
        chatClient.prompt()
                .messages(messages)
                .tools(allToolsProvider)
                .stream()
                .content()
                .collectList()
                .block()
                .forEach(response::append);

        return response.toString();
    }

    private Flux<String> callAiStream(String systemPrompt, String input, List<ChatMemoryStore.Message> history) {
        List<Message> messages = new ArrayList<>();
        messages.add(new SystemMessage(systemPrompt));

        for (ChatMemoryStore.Message msg : history) {
            if ("user".equals(msg.getRole())) {
                messages.add(new UserMessage(msg.getContent()));
            } else {
                messages.add(new AssistantMessage(msg.getContent()));
            }
        }

        messages.add(new UserMessage(input));

        return chatClient.prompt()
                .messages(messages)
                .tools(allToolsProvider)
                .stream()
                .content();
    }

    private void saveMessages(String sessionId, String userInput, String aiResponse, 
                             String identity, Long concertId, String singer) {
        List<ChatMemoryStore.Message> messages = new ArrayList<>();
        
        ChatMemoryStore.Message userMsg = new ChatMemoryStore.Message();
        userMsg.setRole("user");
        userMsg.setContent(userInput);
        userMsg.setIdentity(identity);
        userMsg.setConcertId(concertId);
        userMsg.setMetadata(java.util.Map.of("singer", singer, "type", "dedicated"));
        userMsg.setTimestamp(System.currentTimeMillis());
        
        ChatMemoryStore.Message aiMsg = new ChatMemoryStore.Message();
        aiMsg.setRole("assistant");
        aiMsg.setContent(aiResponse);
        aiMsg.setIdentity(identity);
        aiMsg.setConcertId(concertId);
        aiMsg.setMetadata(java.util.Map.of("singer", singer, "type", "dedicated"));
        aiMsg.setTimestamp(System.currentTimeMillis());
        
        messages.add(userMsg);
        messages.add(aiMsg);
        
        chatMemoryStore.saveMessages(sessionId, messages);
    }
}
