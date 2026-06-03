package com.concert.agent;

import com.concert.service.AmapService;
import com.concert.service.WeatherService;
import com.concert.agent.UserSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PlanningAgentService {

    private final ChatClient chatClient;
    private final AmapService amapService;      // 高德服务（已有）
    private final WeatherService weatherService; // 和风天气服务（已有）

    /**
     * 动态行程规划入口，支持实时天气/路况异常处理
     * @param session 用户会话（含歌手、城市、出发地等）
     * @param userInput 用户输入（可能包含“下雨怎么办”“堵车”等）
     */
    public String planConcertTrip(UserSession session, String userInput) {
        String singer = session.getSelectedSinger();
        String fromCity = session.getDepartureCity();
        String toCity = session.getConcertCity();

        // 1. 基础行程规划（使用 LLM 生成通用建议）
        String basePlan = generateBasePlan(singer, fromCity, toCity);

        // 2. 异常情况处理（实时天气/路况）
        String emergencyAdvice = handleEmergency(userInput, toCity);

        // 3. 合并返回
        return basePlan + (emergencyAdvice.isEmpty() ? "" : "\n\n" + emergencyAdvice);
    }

    private String generateBasePlan(String singer, String fromCity, String toCity) {
        String prompt = String.format(
                "为用户规划演唱会行程。歌手：%s，出发城市：%s，目的地：%s。请给出交通建议、住宿建议和温馨提示，80字以内。",
                singer != null ? singer : "未知",
                fromCity != null ? fromCity : "出发地",
                toCity != null ? toCity : "目的地"
        );
        try {
            return chatClient.prompt().user(prompt).call().content();
        } catch (Exception e) {
            log.error("生成行程计划失败", e);
            return "建议提前2小时到达场馆，携带身份证和门票。";
        }
    }

    /**
     * 根据用户输入中的关键词，调用实时天气/路况 API 给出建议
     */
    private String handleEmergency(String userInput, String city) {
        if (city == null) return "";

        if (userInput.contains("下雨") || userInput.contains("雨")) {
            // 获取实时天气（未来3天第一天的天气）
            List<WeatherService.WeatherData> forecasts = weatherService.getForecast(city);
            if (forecasts != null && !forecasts.isEmpty()) {
                WeatherService.WeatherData today = forecasts.get(0);
                return String.format("⚠️ 天气提醒：%s %s，温度 %d~%d℃。%s 建议携带雨具，提前出发。",
                        today.date, today.weatherDay, today.tempMin, today.tempMax, today.dressingAdvice);
            } else {
                return "⚠️ 可能下雨，建议带好雨具并提前出发。";
            }
        }

        if (userInput.contains("堵车") || userInput.contains("路况")) {
            // 高德实时路况（这里需要实现具体路况查询，简单返回建议）
            return "🚗 实时路况提醒：演唱会周边晚高峰可能拥堵，建议改乘地铁或提前1小时出发。";
        }

        if (userInput.contains("热") || userInput.contains("冷")) {
            // 天气温度建议
            List<WeatherService.WeatherData> forecasts = weatherService.getForecast(city);
            if (forecasts != null && !forecasts.isEmpty()) {
                WeatherService.WeatherData today = forecasts.get(0);
                return String.format("🌡️ 温度提醒：预计 %d~%d℃，%s", today.tempMin, today.tempMax, today.dressingAdvice);
            }
        }
        return "";
    }

    // 保留原有接口兼容性（如果你的 Controller 还用到旧的 planConcertTrip(String,Long)）
    public String planConcertTrip(String userInput, Long userId) {
        // 简单处理，不依赖 session，但建议逐步迁移到使用 UserSession 的版本
        return generateBasePlan(null, null, null) + "\n" + handleEmergency(userInput, null);
    }
}