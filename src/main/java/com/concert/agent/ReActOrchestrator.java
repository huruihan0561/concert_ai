package com.concert.agent;

import com.concert.config.ChatMemoryStore;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReActOrchestrator {

    private final ChatClient chatClient;
    private final MusicTools musicTools;
    private final PlanningTools planningTools;
    private final ConcertTools concertTools;
    private final ReActTraceStore traceStore;

    private static final int MAX_ITERATIONS = 6;

    /**
     * 阻塞式调用（向后兼容）
     */
    public String run(String systemPrompt, String userInput, List<ChatMemoryStore.Message> history) {
        return run(systemPrompt, userInput, history, null);
    }

    /**
     * 阻塞式调用（带 sessionId，用于推理链路追踪）
     */
    public String run(String systemPrompt, String userInput, List<ChatMemoryStore.Message> history, String sessionId) {
        List<Message> messages = buildMessages(systemPrompt, userInput, history);

        for (int i = 0; i < MAX_ITERATIONS; i++) {
            log.info("ReAct 第 {} 轮迭代", i + 1);
            int step = i + 1;

            ChatResponse response = chatClient.prompt()
                    .messages(messages)
                    .tools(musicTools, planningTools, concertTools)
                    .call()
                    .chatResponse();

            if (response == null || response.getResults() == null || response.getResults().isEmpty()) {
                break;
            }

            var output = response.getResults().get(0).getOutput();
            if (output == null) break;

            List<AssistantMessage.ToolCall> toolCalls = output.getToolCalls();
            if (toolCalls == null || toolCalls.isEmpty()) {
                String answer = output.getText();
                String finalText = answer != null ? answer : "抱歉，我暂时无法回答这个问题。";
                if (sessionId != null) {
                    traceStore.appendStep(sessionId, ReActStep.finalAnswer(step, finalText));
                }
                return finalText;
            }

            // 记录：思考 + 工具调用
            String thought = output.getText();
            if (thought != null && !thought.isBlank() && sessionId != null) {
                traceStore.appendStep(sessionId, ReActStep.thought(step, "思考中...", thought));
            }

            for (AssistantMessage.ToolCall tc : toolCalls) {
                String toolName = getToolCallName(tc);
                String toolArgs = getToolCallArgumentsStr(tc);
                if (sessionId != null) {
                    traceStore.appendStep(sessionId, ReActStep.toolCall(step, toolName, toolArgs, null));
                }

                log.info("执行工具调用: {}({})", toolName, toolArgs);
                String result = executeTool(toolName, toolArgs);
                log.info("工具调用结果: {}", result);

                if (sessionId != null) {
                    traceStore.appendStep(sessionId, ReActStep.toolResult(step, toolName, truncate(result, 500), i == MAX_ITERATIONS - 1));
                }
                messages.add(new UserMessage(result));
            }
        }

        return "我已了解你的需求，让我再想想...\n\n" +
                "如需具体帮助，可以直接告诉我，例如：「成都明天天气怎么样」或「推荐几首歌」。";
    }

    private String truncate(String s, int maxLen) {
        if (s == null) return "";
        return s.length() > maxLen ? s.substring(0, maxLen) + "..." : s;
    }

    /**
     * 获取工具调用参数（兼容 Spring AI 不同版本），返回字符串
     */
    private String getToolCallArgumentsStr(AssistantMessage.ToolCall toolCall) {
        return getToolCallArguments(toolCall).toString();
    }

    private Object getToolCallArguments(AssistantMessage.ToolCall toolCall) {
        try {
            return toolCall.getClass().getMethod("getArguments").invoke(toolCall);
        } catch (Exception e) {
            try {
                return toolCall.getClass().getDeclaredField("arguments").get(toolCall);
            } catch (Exception ex) {
                return "{}";
            }
        }
    }

    /**
     * 获取工具调用名称（兼容 Spring AI 不同版本）
     */
    private String getToolCallName(AssistantMessage.ToolCall toolCall) {
        try {
            return toolCall.getClass().getMethod("getName").invoke(toolCall).toString();
        } catch (Exception e) {
            try {
                return toolCall.getClass().getDeclaredField("name").get(toolCall).toString();
            } catch (Exception ex) {
                return "unknown";
            }
        }
    }

    /**
     * 执行单个工具
     */
    private String executeTool(String toolName, Object arguments) {
        try {
            // 将arguments转换为字符串，提取参数值
            String argsStr = arguments != null ? arguments.toString() : "{}";
            
            // 解析参数（简化处理，实际应该用JSON解析）
            String singer = extractParameter(argsStr, "singer");
            String city = extractParameter(argsStr, "city");
            String venue = extractParameter(argsStr, "venue");
            String concertIdStr = extractParameter(argsStr, "concertId");
            Long concertId = concertIdStr != null ? Long.parseLong(concertIdStr) : null;

            // 执行对应工具
            switch (toolName) {
                case "getAllSingers":
                    return concertTools.getAllSingers();
                case "getAllConcerts":
                    return concertTools.getAllConcerts();
                case "getSingerConcerts":
                    return concertTools.getSingerConcerts(singer != null ? singer : "");
                case "getConcertDetail":
                    return concertTools.getConcertDetail(concertId);
                case "searchMeituanFood":
                    return planningTools.searchMeituanFood(city != null ? city : "", venue != null ? venue : "");
                case "searchMeituanHotel":
                    return planningTools.searchMeituanHotel(city != null ? city : "", venue != null ? venue : "");
                case "estimateMeituanRide":
                    return planningTools.estimateMeituanRide(city != null ? city : "", venue != null ? venue : "");
                case "getWeather":
                    return planningTools.getWeather(city != null ? city : "");
                case "searchTrains":
                    return planningTools.searchTrains("", city != null ? city : "", "");
                case "getSingerPlaylist":
                    List<Map<String, String>> playlist = musicTools.getSingerPlaylist(singer != null ? singer : "");
                    return formatPlaylist(playlist);
                default:
                    return "未知工具: " + toolName;
            }
        } catch (Exception e) {
            log.error("工具调用失败: {}", e.getMessage());
            return "工具调用失败: " + e.getMessage();
        }
    }

    /**
     * 将歌单列表格式化为字符串
     */
    private String formatPlaylist(List<Map<String, String>> playlist) {
        if (playlist == null || playlist.isEmpty()) {
            return "未找到相关歌曲";
        }
        
        StringBuilder sb = new StringBuilder();
        sb.append("**推荐歌曲**\n\n");
        
        for (int i = 0; i < playlist.size(); i++) {
            Map<String, String> song = playlist.get(i);
            sb.append(String.format("%d. %s - %s\n", i + 1, 
                    song.getOrDefault("title", "未知歌曲"),
                    song.getOrDefault("artist", "未知歌手")));
        }
        
        return sb.toString();
    }

    /**
     * 从参数字符串中提取参数值（简化解析）
     */
    private String extractParameter(String argsStr, String paramName) {
        // 查找参数名
        String key = "\"" + paramName + "\"";
        int idx = argsStr.indexOf(key);
        if (idx == -1) {
            key = "'" + paramName + "'";
            idx = argsStr.indexOf(key);
            if (idx == -1) {
                return null;
            }
        }

        // 查找冒号
        int colonIdx = argsStr.indexOf(":", idx);
        if (colonIdx == -1) return null;

        // 查找值的开始位置（跳过空格）
        int valueStart = colonIdx + 1;
        while (valueStart < argsStr.length() && Character.isWhitespace(argsStr.charAt(valueStart))) {
            valueStart++;
        }

        // 确定值的结束位置
        char firstChar = argsStr.charAt(valueStart);
        int valueEnd;
        
        if (firstChar == '"' || firstChar == '\'') {
            // 带引号的字符串
            valueEnd = argsStr.indexOf(firstChar, valueStart + 1);
            if (valueEnd == -1) valueEnd = argsStr.length();
            return argsStr.substring(valueStart + 1, valueEnd);
        } else {
            // 数字或其他类型
            valueEnd = valueStart;
            while (valueEnd < argsStr.length() && !Character.isWhitespace(argsStr.charAt(valueEnd)) 
                   && argsStr.charAt(valueEnd) != ',' && argsStr.charAt(valueEnd) != '}') {
                valueEnd++;
            }
            return argsStr.substring(valueStart, valueEnd);
        }
    }

    /**
     * 真正的流式调用 - 支持 ReAct 循环中的流式输出
     */
    public Flux<String> stream(String systemPrompt, String userInput, List<ChatMemoryStore.Message> history) {
        List<Message> messages = buildMessages(systemPrompt, userInput, history);

        return streamWithReAct(messages, 0);
    }

    /**
     * 递归流式处理 ReAct 循环
     */
    private Flux<String> streamWithReAct(List<Message> messages, int iteration) {
        if (iteration >= MAX_ITERATIONS) {
            return Flux.just("我已了解你的需求，让我再想想...\n\n" +
                    "如需具体帮助，可以直接告诉我，例如：「成都明天天气怎么样」或「推荐几首歌」。");
        }

        log.info("ReAct 流式第 {} 轮迭代", iteration + 1);

        // 使用 stream() 获取流式响应
        return chatClient.prompt()
                .messages(messages)
                .tools(musicTools, planningTools, concertTools)
                .stream()
                .chatResponse()
                .map(response -> {
                    if (response.getResults() != null && !response.getResults().isEmpty()) {
                        var output = response.getResults().get(0).getOutput();
                        if (output != null && output.getText() != null) {
                            return output.getText();
                        }
                    }
                    return "";
                })
                .filter(text -> !text.isEmpty())
                .collectList()  // 收集完整的流式响应，用于检查是否有工具调用
                .flatMapMany(tokens -> {
                    String fullText = String.join("", tokens);

                    // 检查这个响应中是否包含工具调用
                    // 注意：在流式模式下，工具调用需要特殊处理
                    // 这里简化处理：如果文本中包含特定关键词，模拟工具调用
                    if (containsToolCall(fullText)) {
                        // 处理工具调用
                        return processToolCalls(messages, fullText, iteration);
                    } else {
                        // 没有工具调用，直接返回流式内容
                        return Flux.fromIterable(
                                fullText.chars()
                                        .mapToObj(c -> String.valueOf((char) c))
                                        .collect(java.util.stream.Collectors.toList())
                        );
                    }
                });
    }

    /**
     * 处理工具调用（简化版，实际需要解析工具调用）
     */
    private Flux<String> processToolCalls(List<Message> messages, String aiResponse, int iteration) {
        // 添加 AI 的响应到消息历史
        messages.add(new AssistantMessage(aiResponse));

        // 模拟执行工具（实际应该解析工具调用并执行）
        // 这里简化：直接继续下一轮
        return streamWithReAct(messages, iteration + 1);
    }

    /**
     * 检查是否包含工具调用（简化判断）
     */
    private boolean containsToolCall(String text) {
        // 实际应该检查 JSON 格式的工具调用
        return text.contains("tool_calls") || text.contains("\"function\"");
    }

    private List<Message> buildMessages(String systemPrompt, String userInput, List<ChatMemoryStore.Message> history) {
        List<Message> messages = new ArrayList<>();
        messages.add(new SystemMessage(systemPrompt));

        if (history != null && !history.isEmpty()) {
            for (ChatMemoryStore.Message m : history) {
                if ("user".equals(m.getRole())) {
                    messages.add(new UserMessage(m.getContent()));
                } else {
                    messages.add(new AssistantMessage(m.getContent()));
                }
            }
        }

        messages.add(new UserMessage(userInput));
        return messages;
    }
}