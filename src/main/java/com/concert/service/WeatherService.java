package com.concert.service;

import com.alibaba.fastjson2.JSONArray;
import com.alibaba.fastjson2.JSONObject;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * 和风天气（QWeather）API 封装服务
 * https://dev.qweather.com/
 */
@Slf4j
@Service
public class WeatherService {

    private static final String QWEATHER_GEO_URL = "https://geoapi.qweather.com/v2/city/lookup";
    private static final String QWEATHER_DAILY_URL = "https://devapi.qweather.com/v7/weather/3d";

    @Value("${api.weather.qweather.key:}")
    private String qweatherKey;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * 获取城市未来3天的天气预报
     * @param cityName 城市名称，如"成都"
     * @return 天气数据列表
     */
    public List<WeatherData> getForecast(String cityName) {
        List<WeatherData> forecasts = new ArrayList<>();
        if (qweatherKey == null || qweatherKey.isBlank()) {
            log.warn("QWeather key 未配置，天气查询跳过");
            return forecasts;
        }

        try {
            // 1. 城市名 → location ID
            String locationId = getLocationId(cityName);
            if (locationId == null) {
                log.warn("QWeather 城市定位失败: {}", cityName);
                return forecasts;
            }

            // 2. 获取3天预报
            String url = QWEATHER_DAILY_URL
                    + "?location=" + locationId
                    + "&key=" + qweatherKey;
            String resp = restTemplate.getForObject(url, String.class);
            JSONObject json = JSONObject.parseObject(resp);
            if (!"200".equals(json.getString("code"))) {
                log.warn("QWeather 预报查询失败: code={}, city={}", json.getString("code"), cityName);
                return forecasts;
            }

            JSONArray daily = json.getJSONArray("daily");
            if (daily == null || daily.isEmpty()) return forecasts;

            for (int i = 0; i < daily.size(); i++) {
                JSONObject d = daily.getJSONObject(i);
                WeatherData w = new WeatherData();
                w.cityName = cityName;
                w.date = d.getString("fxDate");
                w.weatherDay = d.getString("textDay");
                w.weatherNight = d.getString("textNight");
                w.tempMax = parseInt(d.getString("tempMax"));
                w.tempMin = parseInt(d.getString("tempMin"));
                w.windDay = d.getString("windDirDay");
                w.windDayDegree = parseInt(d.getString("windDegreeDay"));
                w.humidity = parseInt(d.getString("humidity"));
                w.precip = parseFloat(d.getString("precip"));
                w.uvIndex = parseInt(d.getString("uvIndex"));
                w.sunrise = d.getString("sunrise");
                w.sunset = d.getString("sunset");
                w.dressingAdvice = buildDressingAdvice(w.weatherDay, w.tempMax, w.tempMin, w.uvIndex);
                forecasts.add(w);
            }
        } catch (Exception e) {
            log.warn("QWeather 天气查询异常: city={}, error={}", cityName, e.getMessage());
        }
        return forecasts;
    }

    private String getLocationId(String cityName) {
        try {
            String url = QWEATHER_GEO_URL
                    + "?location=" + URLEncoder.encode(cityName, StandardCharsets.UTF_8)
                    + "&key=" + qweatherKey;
            String resp = restTemplate.getForObject(url, String.class);
            JSONObject json = JSONObject.parseObject(resp);
            if (!"200".equals(json.getString("code"))) return null;
            JSONArray locations = json.getJSONArray("location");
            if (locations != null && !locations.isEmpty()) {
                return locations.getJSONObject(0).getString("id");
            }
        } catch (Exception e) {
            log.warn("QWeather 城市定位失败: city={}, error={}", cityName, e.getMessage());
        }
        return null;
    }

    private String buildDressingAdvice(String weather, Integer tempMax, Integer tempMin, Integer uvIndex) {
        StringBuilder sb = new StringBuilder();

        // 温度相关
        if (tempMax != null && tempMax >= 38) {
            sb.append("⚠️ 极端高温，极易中暑，请避免烈日直晒，多补充水分！");
        } else if (tempMax != null && tempMax >= 35) {
            sb.append("🔥 高温炎热，建议穿透气短袖，务必涂抹防晒霜。");
        } else if (tempMax != null && tempMax >= 30) {
            sb.append("☀️ 温暖舒适，适宜户外活动，穿着轻薄夏装即可。");
        } else if (tempMax != null && tempMax >= 24) {
            sb.append("🌤️ 气温适宜，早晚略凉，建议短袖+薄外套。");
        } else if (tempMax != null && tempMax >= 18) {
            sb.append("🍃 天气微凉，建议外套+长袖，注意早晚温差。");
        } else {
            sb.append("🧥 天气较凉，建议外套+长裤，注意保暖。");
        }

        // 天气状况
        if (weather != null) {
            if (weather.contains("雨") || weather.contains("雪")) {
                sb.append(" 记得带好雨具，路面湿滑注意安全。");
            }
            if (weather.contains("雷")) {
                sb.append(" 雷雨天气请避免在空旷处停留，注意防雷。");
            }
            if (weather.contains("雾") || weather.contains("霾")) {
                sb.append(" 能见度较差，出行请注意交通安全，佩戴口罩。");
            }
        }

        // 紫外线
        if (uvIndex != null) {
            if (uvIndex >= 8) {
                sb.append(" 紫外线极强（" + uvIndex + "级），请使用SPF50+防晒霜，遮阳伞/帽必备。");
            } else if (uvIndex >= 5) {
                sb.append(" 紫外线较强（" + uvIndex + "级），建议涂抹防晒霜。");
            }
        }

        return sb.toString();
    }

    private Integer parseInt(String s) {
        if (s == null || s.isBlank()) return null;
        try { return Integer.valueOf(s.trim()); } catch (Exception e) { return null; }
    }

    private Float parseFloat(String s) {
        if (s == null || s.isBlank()) return null;
        try { return Float.valueOf(s.trim()); } catch (Exception e) { return null; }
    }

    /**
     * 天气数据结构
     */
    public static class WeatherData {
        public String cityName;
        public String date;           // 日期 yyyy-MM-dd
        public String weatherDay;     // 白天天气
        public String weatherNight;  // 夜间天气
        public Integer tempMax;      // 最高温度(℃)
        public Integer tempMin;      // 最低温度(℃)
        public String windDay;       // 白天风向
        public Integer windDayDegree;// 白天风力等级
        public Integer humidity;      // 相对湿度%
        public Float precip;         // 降水量(mm)
        public Integer uvIndex;      // 紫外线指数
        public String sunrise;       // 日出时间
        public String sunset;        // 日落时间
        public String dressingAdvice; // 穿衣建议
    }
}
