package com.concert.agent;

import com.concert.config.ChatMemoryStore;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicReference;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ConcertOrchestratorAgent {

    private final ConcertContextHolder contextHolder;
    private final ChatMemoryStore chatMemoryStore;
    private final ActiveReminderScheduler reminderScheduler;
    private final ReActOrchestrator reactOrchestrator;

    // 用于收集流式响应的缓存
    private final ConcurrentHashMap<String, StringBuilder> responseBuffer = new ConcurrentHashMap<>();

    // 过滤掉过长的连续相同字符，防止恶意刷屏（保留 emoji）
    private static final Pattern SPAM_PATTERN = Pattern.compile("(.)\\1{10,}");

    /**
     * 阻塞式处理（向后兼容）
     */
    public String process(String sessionId, Long userId, String input, Long concertId, String identity, Boolean hasIdentity, String singer) {
        log.info("Orchestrator收到: sessionId={}, userId={}, input={}", sessionId, userId, input);

        UserSession session = prepareSession(sessionId, userId, concertId, identity, hasIdentity, singer);

        // 检查提醒
        if (userId != null && Boolean.TRUE.equals(session.getReminderEnabled())) {
            String reminder = reminderScheduler.pollReminder(userId);
            if (reminder != null) {
                return reminder + "\n\n" + route(session, input);
            }
        }

        autoRegisterFanIfNeeded(session, input);
        String response = route(session, input);

        // 保存消息
        saveMessages(sessionId, input, response, identity, concertId);
        trimHistory(sessionId);
        contextHolder.saveSession(session);

        response = appendMeituanRecommendation(response, session);
        return response;
    }

    /**
     * 真正的流式处理 - 逐字输出
     */
    public Flux<String> stream(String sessionId, Long userId, String input, Long concertId, String identity, Boolean hasIdentity, String singer) {
        log.info("Orchestrator流式收到: sessionId={}, userId={}, input={}", sessionId, userId, input);

        UserSession session = prepareSession(sessionId, userId, concertId, identity, hasIdentity, singer);

        // 初始化响应缓存
        responseBuffer.put(sessionId, new StringBuilder());

        // 先发送一个开始标记（可选）
        Flux<String> startFlux = Flux.just("");

        // 检查提醒
        Flux<String> reminderFlux = checkReminder(userId, session);
        if (reminderFlux != null) {
            return reminderFlux;
        }

        autoRegisterFanIfNeeded(session, input);

        String systemPrompt = buildSystemPrompt(session);
        List<ChatMemoryStore.Message> history = chatMemoryStore.getMessages(sessionId);

        // 用阻塞式 ReAct 获取完整响应（包含工具调用结果），再逐字符流式返回
        String fullResponse;
        try {
            fullResponse = reactOrchestrator.run(systemPrompt, input, history, sessionId);
        } catch (Exception e) {
            log.error("ReAct 执行失败: sessionId={}", sessionId, e);
            fullResponse = "抱歉，服务暂时不可用，请稍后重试。";
        }

        // 过滤刷屏字符，保留 emoji 和正常文字
        String cleanResponse = stripSpam(fullResponse);
        String meituan = buildMeituanBlock(session.getSelectedSinger(), session.getConcertCity());
        String completeResponse = cleanResponse + meituan;

        // 异步保存消息
        Mono.fromRunnable(() -> {
            saveMessages(sessionId, input, completeResponse, identity, concertId);
            trimHistory(sessionId);
            contextHolder.saveSession(session);
            responseBuffer.remove(sessionId);
        }).subscribeOn(Schedulers.boundedElastic()).subscribe();

        log.info("ReAct 完成，sessionId={}, 响应长度={}", sessionId, completeResponse.length());

        // 逐字符流式返回
        return Flux.fromIterable(completeResponse.chars()
                .mapToObj(c -> String.valueOf((char) c))
                .collect(Collectors.toList()));
    }

    /**
     * 检查提醒
     */
    private Flux<String> checkReminder(Long userId, UserSession session) {
        if (userId != null && Boolean.TRUE.equals(session.getReminderEnabled())) {
            String reminder = reminderScheduler.pollReminder(userId);
            if (reminder != null) {
                return Flux.fromIterable((reminder + "\n\n").chars()
                        .mapToObj(c -> String.valueOf((char) c))
                        .collect(Collectors.toList()));
            }
        }
        return null;
    }

    /**
     * 准备会话
     */
    private UserSession prepareSession(String sessionId, Long userId, Long concertId, String identity, Boolean hasIdentity, String singer) {
        UserSession session = contextHolder.getSession(sessionId);
        if (userId != null) session.setUserId(userId.toString());
        if (concertId != null) session.setConcertId(concertId);
        if (singer != null) session.setSelectedSinger(singer);
        if (identity != null) session.setIdentity(identity);
        if (hasIdentity != null) session.setHasIdentity(hasIdentity);
        return session;
    }

    /**
     * 路由处理（阻塞式）
     */
    private String route(UserSession session, String input) {
        String systemPrompt = buildSystemPrompt(session);
        List<ChatMemoryStore.Message> history = chatMemoryStore.getMessages(session.getSessionId());
        return reactOrchestrator.run(systemPrompt, input, history, session.getSessionId());
    }

    /**
     * 保存消息
     */
    private void saveMessages(String sessionId, String userInput, String assistantResponse, String identity, Long concertId) {
        chatMemoryStore.saveMessages(sessionId, List.of(
                new ChatMemoryStore.Message("user", userInput, identity, concertId),
                new ChatMemoryStore.Message("assistant", assistantResponse, identity, concertId)
        ));
    }

    /**
     * 构建系统提示词
     */
    private String buildSystemPrompt(UserSession session) {
        return """
                你是演唱会管家"小团团"，同时也是美团的演唱会陪看伙伴~\uD83C\uDFB5

                ## 当前会话信息
                - 演唱会ID：%s
                - 歌手：%s
                - 城市：%s
                - 出发城市：%s
                - 行程天数：%s
                - 预算：%s

                ## 用户可能发来的行程规划请求格式（来自表单）
                如果用户发送的消息包含【行程规划请求】开头，说明用户已通过表单提交了完整行程信息。
                结构化格式如下，请根据这些信息直接调用工具生成规划：
                - 歌手、城市、场馆、演唱会日期时间（已知）
                - 出发城市、出发日期、返程日期、行程天数
                - 游玩偏好（自然风光/历史文化/逛街购物/网红打卡）
                - 预算（经济/适中/宽裕）
                - 附加需求（需要安排：酒店住宿/餐饮美食/交通出行）
                - 备注

                ## 你可以使用的美团工具（必须优先推荐美团服务）
                - searchMeituanFood(city, venue)    查询场馆周边美团外卖/到店美食
                - searchMeituanHotel(city, venue)   查询美团酒店推荐
                - searchMeituanTickets(concertId, singer) 查询美团门票信息
                - estimateMeituanRide(origin, dest) 预估美团打车费用
                - createMeituanReminder(concertId)  设置美团开抢提醒

                ## 座位相关工具（必须调用）
                - getSeatInfo(concertId, areaName)  查询演唱会座位图信息和选座建议。
                  当用户询问"哪个座位好/推荐座位/选座建议/A1区怎么样/内场前排视野"等问题时，**必须**先调用此工具获取座位配置信息，不要编造数据！
                  调用示例：getSeatInfo(concertId=%s, areaName="A1区")

                ## 其他工具
                - getWeather(cityName)              查询天气
                - searchTrains(from, to, date)      查询火车票
                - getSingerPlaylist(singer)         获取歌手歌单

                ## 行为准则
                1. **优先使用会话中的已知信息**：如果歌手、城市、concertId 已在上下文中，直接用即可，**不要**调用 getSingerConcerts、getAllSingers 等工具重新查询！
                2. **如果不知道城市/concertId，直接问用户**：
                   - 当用户询问场馆周边美食/酒店/交通，但不知道具体城市时，**立即**问用户："请问您想了解哪个城市的张杰演唱会周边？"
                   - **禁止**调用 getSingerConcerts 等工具来"试探"，这样只会把问题复杂化！
                   - 简短提问即可，不要长篇大论。
                3. 语气活泼友好，像朋友聊天，可以适当用 emoji 表情增添活力，但不要过度。
                4. 回复内容结构清晰，善用 Markdown 标题、列表、表格提升可读性。
                5. 当用户询问座位推荐、选座建议、某个区域怎么样时，**必须**先调用 getSeatInfo(concertId=%s, areaName="xxx") 工具获取座位配置信息，绝对不能编造数据！
                6. 涉及演唱会抢票时，主动推荐设置美团提醒。
                7. 不要编造数据，必须调用工具获取结果。
                8. 如果用户询问行程规划但信息不全（缺少出发城市、出发日期等），**必须先引导用户提供缺失信息**，不要直接生成行程！
                   引导方式：友好地列出还缺少哪些信息，如："好的，我来帮你规划行程！还请告诉我：你从哪个城市出发？计划哪天出发？"
                """.formatted(
                session.getConcertId() != null ? session.getConcertId().toString() : "未指定",
                nullSafe(session.getSelectedSinger()),
                nullSafe(session.getConcertCity()),
                nullSafe(session.getDepartureCity()),
                session.getTripDays() != null ? session.getTripDays() + "天" : "未指定",
                nullSafe(session.getBudgetLevel()),
                session.getConcertId() != null ? session.getConcertId().toString() : "null",
                session.getConcertId() != null ? session.getConcertId().toString() : "null"
        );
    }

    /**
     * 自动注册粉丝
     */
    private void autoRegisterFanIfNeeded(UserSession session, String input) {
        if (session.getSelectedSinger() != null && session.getConcertCity() != null) {
            if (input.contains("看") && input.contains("演唱会")) {
                contextHolder.registerFan(session.getSelectedSinger(), session.getConcertCity(), session.getUserId());
                log.info("自动注册粉丝: singer={} city={} userId={}",
                        session.getSelectedSinger(), session.getConcertCity(), session.getUserId());
            }
        }
    }

    /**
     * 构建美团推荐块
     */
    private String buildMeituanBlock(String singer, String city) {
        if (singer == null || city == null) return "";
        return "\n\n---\n" +
                "**美团演唱会专区** \n\n" +
                "  [场馆周边美食](imeituan://food?city=" + city + ")  \n" +
                "  [美团酒店预订](imeituan://hotel?city=" + city + ")  \n" +
                "  [美团门票抢购](imeituan://ticket?keyword=" + singer + ")  \n" +
                "  [美团打车预估](imeituan://ride)  \n\n" +
                "回复「附近美食」「订酒店」等关键词，我可以帮你查具体信息~";
    }

    /**
     * 追加美团推荐
     */
    private String appendMeituanRecommendation(String response, UserSession session) {
        String singer = session.getSelectedSinger();
        String city = session.getConcertCity();
        if (singer == null || city == null) return response;
        if (response.contains("美团")) return response;
        return response + buildMeituanBlock(singer, city);
    }

    /**
     * 过滤刷屏字符（连续重复字符），保留 emoji
     */
    private String stripSpam(String text) {
        if (text == null) return "";
        return SPAM_PATTERN.matcher(text).replaceAll("$1$1$1");
    }

    /**
     * 裁剪历史记录
     */
    private void trimHistory(String sessionId) {
        List<ChatMemoryStore.Message> all = chatMemoryStore.getMessages(sessionId);
        if (all.size() > 20) {
            List<ChatMemoryStore.Message> trimmed = all.subList(all.size() - 20, all.size());
            chatMemoryStore.saveMessages(sessionId, trimmed);
        }
    }

    /**
     * 空值安全处理
     */
    private String nullSafe(String s) {
        return s != null && !s.isBlank() ? s : "未指定";
    }
}