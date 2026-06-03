package com.concert.service.impl;

import com.concert.dto.TravelPlanRequestDTO;
import com.concert.entity.Concert;
import com.concert.mapper.ConcertMapper;
import com.concert.service.AiPlanningService;
import com.concert.vo.TravelPlanVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiPlanningServiceImpl implements AiPlanningService {

    private final ConcertMapper concertMapper;
    private final ChatClient chatClient;

    @Override
    public TravelPlanVO generatePlan(TravelPlanRequestDTO request) {
        log.info("========== AI生成行程攻略 ==========");
        log.info("演唱会ID: {}, 出发城市: {}, 出发日期: {}, 返程日期: {}",
                request.getConcertId(), request.getDepartureCity(),
                request.getDepartureDate(), request.getReturnDate());

        // 1. 查询演唱会信息
        Concert concert = concertMapper.selectById(request.getConcertId());
        if (concert == null) {
            throw new RuntimeException("未找到演唱会信息，ID: " + request.getConcertId());
        }

        TravelPlanVO vo = new TravelPlanVO();

        // 2. 构建演唱会信息
        vo.setConcert(buildConcertInfo(concert));

        // 3. 获取天气（简化）
        vo.setWeather(buildMockWeather(concert.getCity()));

        // 4. 直接让AI生成完整攻略
        String fullGuide = generateFullGuideByAI(concert, request);

        // 5. 解析AI生成的内容到VO
        parseAIGuideToVO(vo, fullGuide, request);

        log.info("========== AI行程攻略生成完成 ==========");
        return vo;
    }

    /**
     * 使用AI生成完整攻略
     */
    private String generateFullGuideByAI(Concert concert, TravelPlanRequestDTO request) {

        long days = request.getDepartureDate().until(request.getReturnDate()).getDays() + 1;
        boolean isLocal = request.getDepartureCity().equals(concert.getCity());
        String specialNeeds = request.getSpecialNeeds();
        boolean hasSpecialNeeds = specialNeeds != null && !specialNeeds.trim().isEmpty();

        String prompt = String.format(
                "你是专业的演唱会行程规划师，正在为用户提供VIP级别的定制化行程规划服务。\n\n" +
                        "【演唱会信息】\n" +
                        "歌手：%s\n" +
                        "城市：%s\n" +
                        "场馆：%s\n" +
                        "地址：%s\n" +
                        "日期：%s\n" +
                        "时间：%s\n" +
                        "票价：%s\n\n" +
                        "【用户基本信息】\n" +
                        "出发城市：%s\n" +
                        "行程天数：%d天（%s 至 %s）\n" +
                        "%s\n\n" +
                        (hasSpecialNeeds
                                ? "【⚠️ 核心特殊需求 — 必须严格执行】\n" +
                                  "用户明确提出了以下特殊需求：\n" +
                                  "「" + specialNeeds.trim() + "」\n\n" +
                                  "请将上述特殊需求作为本次行程规划的【最高优先级】，体现在酒店选择、每日行程、餐饮推荐、交通安排、景点推荐等每一个环节中。\n" +
                                  "举例：若需求涉及无障碍通道，则优先推荐有无障碍设施的酒店和景点；\n" +
                                  "若需求涉及美食，则餐饮推荐必须紧扣当地特色；\n" +
                                  "若需求涉及带老人/小孩，则行程节奏需宽松、交通需便捷。\n\n"
                                : "") +
                        "请生成一份详细的演唱会攻略，并严格按照以下JSON格式返回，不要有任何其他文字：\n\n" +
                        "{\n" +
                        "  \"hotels\": [\n" +
                        "    {\"name\": \"酒店名称\", \"address\": \"地址\", \"priceRange\": \"价格区间\", \"reason\": \"推荐理由（含特殊需求适配说明）\"}\n" +
                        "  ],\n" +
                        "  \"attractions\": [\n" +
                        "    {\"name\": \"景点名称\", \"address\": \"地址\", \"duration\": \"游玩时长\", \"description\": \"特色亮点\"}\n" +
                        "  ],\n" +
                        "  \"dailyItinerary\": [\n" +
                        "    {\"day\": 1, \"date\": \"日期\", \"morning\": \"上午活动\", \"afternoon\": \"下午活动\", \"evening\": \"晚上活动\"}\n" +
                        "  ],\n" +
                        "  \"foods\": [\n" +
                        "    {\"name\": \"餐厅名称\", \"address\": \"地址\", \"price\": \"人均消费\", \"recommend\": \"招牌菜\"}\n" +
                        "  ],\n" +
                        "  \"transport\": \"交通建议\",\n" +
                        "  \"tips\": \"温馨提示\"\n" +
                        "}\n\n" +
                        "要求：\n" +
                        "1. 酒店推荐4-5家，每家推荐理由必须说明如何满足用户特殊需求\n" +
                        "2. 每日行程按实际天数安排，行程节奏须贴合特殊需求\n" +
                        "3. 基于%s的真实情况推荐\n" +
                        "4. 只返回JSON，不要有其他文字",
                concert.getSinger(), concert.getCity(), concert.getVenue(), concert.getVenueAddress(),
                concert.getShowTime().format(DateTimeFormatter.ofPattern("yyyy年MM月dd日")),
                concert.getShowTime().format(DateTimeFormatter.ofPattern("HH:mm")),
                concert.getTicketPrice(),
                request.getDepartureCity(),
                days, request.getDepartureDate(), request.getReturnDate(),
                isLocal ? "用户是本地观众" : "用户需要从出发城市前往演唱会城市",
                concert.getCity()
        );

        try {
            String result = chatClient.prompt()
                    .system("你是专业的演唱会行程规划助手，只返回JSON格式数据，不要有其他内容。")
                    .user(prompt)
                    .call()
                    .content();
            log.info("AI生成攻略成功");
            return result != null ? result : "";
        } catch (Exception e) {
            log.error("AI生成攻略失败: {}", e.getMessage());
            return "";
        }
    }

    /**
     * 解析AI生成的JSON到VO
     */
    private void parseAIGuideToVO(TravelPlanVO vo, String aiResponse, TravelPlanRequestDTO request) {
        if (aiResponse == null || aiResponse.isEmpty()) {
            vo.setSummary("攻略生成失败，请稍后重试");
            return;
        }

        try {
            // 提取JSON部分（可能被markdown包裹）
            String jsonStr = aiResponse;
            if (aiResponse.contains("```json")) {
                jsonStr = aiResponse.split("```json")[1].split("```")[0];
            } else if (aiResponse.contains("```")) {
                jsonStr = aiResponse.split("```")[1].split("```")[0];
            }

            com.alibaba.fastjson2.JSONObject json = com.alibaba.fastjson2.JSONObject.parseObject(jsonStr.trim());

            // 解析酒店
            com.alibaba.fastjson2.JSONArray hotelsJson = json.getJSONArray("hotels");
            if (hotelsJson != null && !hotelsJson.isEmpty()) {
                List<TravelPlanVO.HotelVO> hotels = new ArrayList<>();
                for (int i = 0; i < hotelsJson.size(); i++) {
                    com.alibaba.fastjson2.JSONObject h = hotelsJson.getJSONObject(i);
                    TravelPlanVO.HotelVO hotel = new TravelPlanVO.HotelVO();
                    hotel.setName(h.getString("name"));
                    hotel.setAddress(h.getString("address"));
                    hotel.setPriceRange(h.getString("priceRange"));
                    hotel.setStarRating(4);
                    hotel.setDistanceKm("场馆周边");
                    hotel.setMeituanUrl("imeituan://www.meituan.com/hotel/search?keyword=" + h.getString("name"));
                    hotels.add(hotel);
                }
                vo.setHotels(hotels);
            }

            // 解析景点
            com.alibaba.fastjson2.JSONArray attractionsJson = json.getJSONArray("attractions");
            if (attractionsJson != null && !attractionsJson.isEmpty()) {
                // 将景点信息保存到summary中，或者可以扩展VO
                StringBuilder attractionsText = new StringBuilder();
                attractionsText.append("🎯 **推荐景点**\n\n");
                for (int i = 0; i < attractionsJson.size(); i++) {
                    com.alibaba.fastjson2.JSONObject a = attractionsJson.getJSONObject(i);
                    attractionsText.append(String.format("%d. **%s**\n", i+1, a.getString("name")));
                    attractionsText.append(String.format("   📍 地址：%s\n", a.getString("address")));
                    attractionsText.append(String.format("   ⏰ 建议游玩：%s\n", a.getString("duration")));
                    attractionsText.append(String.format("   ✨ 亮点：%s\n\n", a.getString("description")));
                }
                vo.setAttractionsText(attractionsText.toString());
            }

            // 解析每日行程
            com.alibaba.fastjson2.JSONArray itineraryJson = json.getJSONArray("dailyItinerary");
            if (itineraryJson != null && !itineraryJson.isEmpty()) {
                List<TravelPlanVO.DailyItinerary> itineraries = new ArrayList<>();
                for (int i = 0; i < itineraryJson.size(); i++) {
                    com.alibaba.fastjson2.JSONObject d = itineraryJson.getJSONObject(i);
                    TravelPlanVO.DailyItinerary day = new TravelPlanVO.DailyItinerary();
                    day.setDay(d.getInteger("day"));
                    day.setTitle(getDayTitle(d.getInteger("day"), itineraryJson.size()));

                    // 上午活动
                    String morning = d.getString("morning");
                    if (morning != null && !morning.isEmpty()) {
                        day.setMorning(createActivityList(morning));
                    }
                    // 下午活动
                    String afternoon = d.getString("afternoon");
                    if (afternoon != null && !afternoon.isEmpty()) {
                        day.setAfternoon(createActivityList(afternoon));
                    }
                    // 晚上活动
                    String evening = d.getString("evening");
                    if (evening != null && !evening.isEmpty()) {
                        day.setEvening(createActivityList(evening));
                    }

                    itineraries.add(day);
                }
                vo.setDailyItineraries(itineraries);
            }

            // 解析美食
            com.alibaba.fastjson2.JSONArray foodsJson = json.getJSONArray("foods");
            StringBuilder foodsText = new StringBuilder();
            foodsText.append("🍜 **美食推荐**\n\n");
            if (foodsJson != null && !foodsJson.isEmpty()) {
                for (int i = 0; i < foodsJson.size(); i++) {
                    com.alibaba.fastjson2.JSONObject f = foodsJson.getJSONObject(i);
                    foodsText.append(String.format("%d. **%s**\n", i+1, f.getString("name")));
                    foodsText.append(String.format("   📍 %s\n", f.getString("address")));
                    foodsText.append(String.format("   💰 人均：%s\n", f.getString("price")));
                    foodsText.append(String.format("   🍽️ 推荐：%s\n\n", f.getString("recommend")));
                }
            }

            // 构建最终summary
            String transport = json.getString("transport");
            String tips = json.getString("tips");

            StringBuilder summary = new StringBuilder();
            vo.setSummary("");

        } catch (Exception e) {
            log.error("解析AI返回失败: {}", e.getMessage());
            // 如果解析失败，直接使用AI原始文本作为summary
            vo.setSummary(aiResponse);
        }
    }

    private String getDayTitle(int day, int totalDays) {
        if (day == 1) return "🚗 出发日";
        if (day == totalDays) return "🏠 返程日";
        return "🎯 游玩日";
    }

    private List<TravelPlanVO.DailyItinerary.Activity> createActivityList(String description) {
        List<TravelPlanVO.DailyItinerary.Activity> list = new ArrayList<>();
        TravelPlanVO.DailyItinerary.Activity activity = new TravelPlanVO.DailyItinerary.Activity();
        activity.setName(description.length() > 30 ? description.substring(0, 30) : description);
        activity.setDescription(description);
        activity.setDuration("约2小时");
        list.add(activity);
        return list;
    }

    private TravelPlanVO.WeatherInfo buildMockWeather(String city) {
        TravelPlanVO.WeatherInfo weather = new TravelPlanVO.WeatherInfo();
        weather.setCity(city);
        weather.setDate(LocalDate.now().toString());
        weather.setWeather("晴");
        weather.setTemperatureHigh(new BigDecimal(28));
        weather.setTemperatureLow(new BigDecimal(18));
        weather.setDressingAdvice("天气舒适，建议穿着轻便");
        return weather;
    }

    private TravelPlanVO.ConcertInfo buildConcertInfo(Concert concert) {
        TravelPlanVO.ConcertInfo info = new TravelPlanVO.ConcertInfo();
        info.setId(concert.getId());
        info.setSinger(concert.getSinger());
        info.setCity(concert.getCity());
        info.setVenue(concert.getVenue());
        info.setVenueAddress(concert.getVenueAddress());
        info.setShowTime(concert.getShowTime().format(DateTimeFormatter.ofPattern("yyyy年MM月dd日 HH:mm")));
        info.setTicketPrice(concert.getTicketPrice());
        info.setImageUrl(concert.getImageUrl());

        String[] weekdays = {"周一", "周二", "周三", "周四", "周五", "周六", "周日"};
        info.setWeekday(weekdays[concert.getShowTime().getDayOfWeek().getValue() - 1]);

        long daysLeft = LocalDate.now().until(concert.getShowTime().toLocalDate()).getDays();
        info.setDaysLeft(daysLeft > 0 ? daysLeft : 0);

        return info;
    }

    @Override
    public Map<String, Object> getVenue3D(String venueName) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("venueName", venueName);
        result.put("modelUrl", "");
        result.put("message", "3D模型开发中，敬请期待");
        return result;
    }
}