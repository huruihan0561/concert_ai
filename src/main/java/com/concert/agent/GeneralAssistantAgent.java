package com.concert.agent;

import com.concert.config.ChatMemoryStore;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.tool.ToolCallbackProvider;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.ArrayList;
import java.util.List;

/**
 * 通用AI助手 Agent - 用于AI助手页面
 * 特点：
 * 1. 不绑定特定歌手/演唱会
 * 2. 没有身份信息
 * 3. 会话按 userId + general 隔离存储
 * 4. 可以咨询所有演唱会相关问题
 * 5. 引导用户选择演唱会，然后提供美团服务
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GeneralAssistantAgent {

    private final ChatClient chatClient;
    private final ChatMemoryStore chatMemoryStore;
    private final ConcertContextHolder contextHolder;
    private final ToolCallbackProvider allToolsProvider;
    private final ReActOrchestrator reActOrchestrator;

    /**
     * 处理消息 - 非流式
     */
    public String process(String sessionId, Long userId, String input) {
        log.info("【通用助手】收到消息: userId={}, sessionId={}, input={}", userId, sessionId, input);

        // 使用前端传递的 sessionId，如果没有则构建通用 sessionId
        String generalSessionId = (sessionId != null && !sessionId.isEmpty()) 
                ? sessionId 
                : buildGeneralSessionId(userId);
        
        // 获取或创建会话
        UserSession session = contextHolder.getSession(generalSessionId);
        session.setUserId(userId != null ? userId.toString() : null);
        session.setHasIdentity(false);

        // 构建系统提示词
        String systemPrompt = buildGeneralSystemPrompt();
        
        // 获取历史消息
        List<ChatMemoryStore.Message> history = chatMemoryStore.getMessages(generalSessionId);
        
        // 调用 AI
        String response = callAi(systemPrompt, input, history, generalSessionId);
        
        // 保存消息（JSON格式，无身份信息）
        saveMessages(generalSessionId, input, response, userId);
        
        contextHolder.saveSession(session);
        
        return response;
    }

    /**
     * 处理消息 - 流式
     * 同步调用 AI，实时流式返回 tokens
     */
    public Flux<String> stream(String sessionId, Long userId, String input) {
        log.info("【通用助手】流式收到消息: userId={}, sessionId={}, input={}", userId, sessionId, input);

        String generalSessionId = (sessionId != null && !sessionId.isEmpty())
                ? sessionId
                : buildGeneralSessionId(userId);

        UserSession session = contextHolder.getSession(generalSessionId);
        session.setUserId(userId != null ? userId.toString() : null);
        session.setHasIdentity(false);

        String systemPrompt = buildGeneralSystemPrompt();
        List<ChatMemoryStore.Message> history = chatMemoryStore.getMessages(generalSessionId);

        // 先保存用户消息
        ChatMemoryStore.Message userMsg = new ChatMemoryStore.Message();
        userMsg.setRole("user");
        userMsg.setContent(input);
        userMsg.setIdentity(null);
        userMsg.setConcertId(null);
        userMsg.setMetadata(java.util.Map.of("userId", userId != null ? userId.toString() : null, "type", "general"));
        userMsg.setTimestamp(System.currentTimeMillis());
        chatMemoryStore.saveMessages(generalSessionId, List.of(userMsg));

        // 同步调用 AI（不走 Spring AI 的流式，保持响应完整性）
        String fullResponse;
        try {
            fullResponse = callAi(systemPrompt, input, history, generalSessionId);
        } catch (Exception e) {
            log.error("【通用助手】AI 调用失败", e);
            return Flux.just("抱歉，服务暂时不可用，请稍后重试。")
                    .doOnComplete(() -> saveAssistantMessage(generalSessionId, "抱歉，服务暂时不可用，请稍后重试。", userId));
        }

        // 保存 AI 响应到历史
        saveAssistantMessage(generalSessionId, fullResponse, userId);
        contextHolder.saveSession(session);

        // 将响应拆分并流式返回，按标点/换行分段，每段延迟 15ms 模拟打字效果
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
     * 构建通用 SessionId：userId_general
     */
    private String buildGeneralSessionId(Long userId) {
        return String.format("%d_general", userId);
    }

    /**
     * 构建通用系统提示词
     */
    private String buildGeneralSystemPrompt() {
        return """
                嗨~ 我是演唱会管家"小团团"！\uD83D\uDC4B 可以叫我小团团哦~\uD83C\uDFB5

                ## 你的定位
                - 你是一位热情洋溢的演唱会规划师，帮助粉丝们实现演唱会之旅！\uD83C\uDF89
                - 你可以回答关于任何演唱会的问题，是用户的贴心小助手
                - 你不绑定特定歌手，可以为用户提供全面的演唱会信息服务~\uD83D\uDCAC

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

                ### 演唱会信息（优先调用）
                - getAllSingers() 获取所有歌手列表
                - getAllConcerts() 获取所有演唱会列表
                - getSingerConcerts(singer) 获取指定歌手的演唱会
                - getConcertDetail(concertId) 获取演唱会详情

                ### 座位相关（必须调用）
                - getSeatInfo(concertId, areaName) 查询座位配置和价格
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

                ## 工作流程
                1. 优先使用会话中的已知信息，不要重复调用 getSingerConcerts 等工具
                2. 如果不知道城市，直接问用户，不要调用工具"试探"
                3. 用户询问美食/酒店/交通时，直接调用对应美团工具
                4. 座位问题必须调用 getSeatInfo

                ## 回答风格
                1. **优先使用会话中的已知信息**：如果歌手、城市、concertId 已在上下文中，直接用即可，**不要**调用 getSingerConcerts、getAllSingers 等工具重新查询！
                2. **如果不知道城市/concertId，直接问用户**：
                   - 当用户询问场馆周边美食/酒店/交通，但不知道具体城市时，**立即**问用户："请问您想了解哪个城市的演唱会周边？"
                   - **禁止**调用 getSingerConcerts 等工具来"试探"，直接简单提问即可。
                3. 语气活泼友好，像热情的朋友聊天！可以适当用 emoji 表情增添活力，但不要过度。
                4. 回复结构清晰，善用 Markdown 标题、列表、表格提升可读性。
                5. 所有推荐优先引导到美团（外卖、酒店、打车、门票）。
                6. 不要编造数据，必须调用工具获取准确信息。
                7. 座位问题必须调用 getSeatInfo 工具，读取配置文件。
                8. 如果用户询问行程规划但信息不全（缺少出发城市、出发日期等），**必须先引导用户提供缺失信息**，不要直接生成行程！

                ## 示例对话
                用户：帮我规划演唱会行程
                你：好的！来帮你规划演唱会之旅！\uD83C\uDF89
                    我需要了解一些信息：
                    - 你从哪个城市出发？
                    - 计划哪天出发？
                    告诉我这些，我就能帮你安排好交通、住宿和游玩路线~\uD83D\uDE97

                用户：我想看演唱会
                你：好的！我可以帮您规划演唱会之旅！\uD83C\uDF89

                    目前热门演唱会歌手有：
                    （调用 getAllSingers 获取列表）

                    您想看哪位歌手的演唱会呢？告诉我歌手名，我为您查询详细信息！\uD83D\uDCAC

                用户：汪苏泷
                你：汪苏泷的演唱会超受欢迎的！\uD83D\uDE0D

                    （调用 getSingerConcerts 获取演唱会列表）

                    汪苏泷有以下场次：
                    1. 成都站 - 2026年6月19日
                    2. ...

                    您想去哪一场呢？确定后我可以帮您：
                    - 推荐最佳座位
                    - 查询成都美食
                    - 推荐附近酒店
                    - 规划交通出行

                用户：成都站
                你：好的！成都站是6月19日19:30在成都东安湖体育公园主体育场！\uD83C\uDFAD

                    您想了解哪方面的信息呢？
                    - 座位推荐
                    - 周边美食
                    - 酒店住宿
                    - 交通出行
                    - 完整行程规划
                """;
    }

    private String callAi(String systemPrompt, String input, List<ChatMemoryStore.Message> history, String sessionId) {
        // 使用 ReActOrchestrator 来处理工具调用循环，传入 sessionId 用于推理链路追踪
        return reActOrchestrator.run(systemPrompt, input, history, sessionId);
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

        return chatClient.prompt(new Prompt(messages))
                .tools(allToolsProvider)
                .stream()
                .content();
    }

    private void saveMessages(String sessionId, String userInput, String aiResponse, Long userId) {
        List<ChatMemoryStore.Message> messages = new ArrayList<>();
        
        ChatMemoryStore.Message userMsg = new ChatMemoryStore.Message();
        userMsg.setRole("user");
        userMsg.setContent(userInput);
        userMsg.setIdentity(null); // 通用助手无身份
        userMsg.setConcertId(null); // 通用助手无特定演唱会
        userMsg.setMetadata(java.util.Map.of("userId", userId, "type", "general"));
        userMsg.setTimestamp(System.currentTimeMillis());
        
        ChatMemoryStore.Message aiMsg = new ChatMemoryStore.Message();
        aiMsg.setRole("assistant");
        aiMsg.setContent(aiResponse);
        aiMsg.setIdentity(null);
        aiMsg.setConcertId(null);
        aiMsg.setMetadata(java.util.Map.of("userId", userId, "type", "general"));
        aiMsg.setTimestamp(System.currentTimeMillis());
        
        messages.add(userMsg);
        messages.add(aiMsg);
        
        chatMemoryStore.saveMessages(sessionId, messages);
    }

    private void saveAssistantMessage(String sessionId, String content, Long userId) {
        ChatMemoryStore.Message aiMsg = new ChatMemoryStore.Message();
        aiMsg.setRole("assistant");
        aiMsg.setContent(content);
        aiMsg.setIdentity(null);
        aiMsg.setConcertId(null);
        aiMsg.setMetadata(java.util.Map.of("userId", userId, "type", "general"));
        aiMsg.setTimestamp(System.currentTimeMillis());
        chatMemoryStore.saveMessages(sessionId, List.of(aiMsg));
    }
}
