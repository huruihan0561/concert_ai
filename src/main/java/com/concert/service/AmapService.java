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
import java.time.LocalDate;
import java.util.*;

@Service
@Slf4j
public class AmapService {

    private static final String AMAP_GEO_URL = "https://restapi.amap.com/v3/geocode/geo";
    private static final String AMAP_PLACE_TEXT_URL = "https://restapi.amap.com/v3/place/text";
    private static final String AMAP_PLACE_AROUND_URL = "https://restapi.amap.com/v3/place/around";
    private static final String AMAP_WEATHER_URL = "https://restapi.amap.com/v3/weather/weatherInfo";

    @Value("${api.amap.key:}")
    private String amapKey;

    private final RestTemplate restTemplate = new RestTemplate();

    // 城市名称到adcode的映射
    private static final Map<String, String> CITY_ADCODE = new HashMap<>();

    static {
        CITY_ADCODE.put("北京", "110000");
        CITY_ADCODE.put("上海", "310000");
        CITY_ADCODE.put("广州", "440100");
        CITY_ADCODE.put("深圳", "440300");
        CITY_ADCODE.put("杭州", "330100");
        CITY_ADCODE.put("南京", "320100");
        CITY_ADCODE.put("成都", "510100");
        CITY_ADCODE.put("西安", "610100");
        CITY_ADCODE.put("武汉", "420100");
        CITY_ADCODE.put("重庆", "500000");
        CITY_ADCODE.put("天津", "120000");
        CITY_ADCODE.put("苏州", "320500");
        CITY_ADCODE.put("郑州", "410100");
        CITY_ADCODE.put("长沙", "430100");
        CITY_ADCODE.put("青岛", "370200");
        CITY_ADCODE.put("洛阳", "410300");
        CITY_ADCODE.put("大连", "210200");
        CITY_ADCODE.put("宁波", "330200");
        CITY_ADCODE.put("厦门", "350200");
        CITY_ADCODE.put("济南", "370100");
        CITY_ADCODE.put("沈阳", "210100");
        CITY_ADCODE.put("长春", "220100");
        CITY_ADCODE.put("哈尔滨", "230100");
        CITY_ADCODE.put("合肥", "340100");
        CITY_ADCODE.put("福州", "350100");
        CITY_ADCODE.put("南昌", "360100");
        CITY_ADCODE.put("南宁", "450100");
        CITY_ADCODE.put("昆明", "530100");
        CITY_ADCODE.put("贵阳", "520100");
        CITY_ADCODE.put("兰州", "620100");
        CITY_ADCODE.put("乌鲁木齐", "650100");
        CITY_ADCODE.put("呼和浩特", "150100");
        CITY_ADCODE.put("银川", "640100");
        CITY_ADCODE.put("西宁", "630100");
        CITY_ADCODE.put("拉萨", "540100");
        CITY_ADCODE.put("海口", "460100");
    }

    // ==================== 1. 地理编码 ====================
    public Map<String, BigDecimal> geocode(String address) {
        Map<String, BigDecimal> result = new HashMap<>();
        if (amapKey == null || amapKey.isBlank()) return result;
        try {
            String url = AMAP_GEO_URL + "?key=" + amapKey + "&address=" + URLEncoder.encode(address, StandardCharsets.UTF_8);
            String resp = restTemplate.getForObject(url, String.class);
            JSONObject json = JSONObject.parseObject(resp);
            if ("1".equals(json.getString("status"))) {
                JSONArray geocodes = json.getJSONArray("geocodes");
                if (geocodes != null && !geocodes.isEmpty()) {
                    String location = geocodes.getJSONObject(0).getString("location");
                    String[] parts = location.split(",");
                    result.put("lng", new BigDecimal(parts[0]));
                    result.put("lat", new BigDecimal(parts[1]));
                }
            }
        } catch (Exception e) {
            log.warn("地理编码失败: {}", e.getMessage());
        }
        return result;
    }

    // ==================== 2. 天气 ====================
    public Map<String, Object> getWeather(String cityName) {
        Map<String, Object> weather = new HashMap<>();
        if (amapKey == null || amapKey.isBlank()) {
            return buildMockWeather(cityName);
        }
        try {
            String adcode = CITY_ADCODE.getOrDefault(cityName, cityName);
            String url = AMAP_WEATHER_URL + "?key=" + amapKey
                    + "&city=" + URLEncoder.encode(adcode, StandardCharsets.UTF_8)
                    + "&extensions=all";
            String resp = restTemplate.getForObject(url, String.class);
            JSONObject json = JSONObject.parseObject(resp);
            if ("1".equals(json.getString("status"))) {
                JSONArray forecasts = json.getJSONArray("forecasts");
                if (forecasts != null && !forecasts.isEmpty()) {
                    JSONObject fc = forecasts.getJSONObject(0);
                    JSONArray casts = fc.getJSONArray("casts");
                    if (casts != null && !casts.isEmpty()) {
                        JSONObject today = casts.getJSONObject(0);
                        weather.put("city", fc.getString("city"));
                        weather.put("date", today.getString("date"));
                        weather.put("weather", today.getString("dayweather"));
                        weather.put("temperatureHigh", today.getString("daytemp"));
                        weather.put("temperatureLow", today.getString("nighttemp"));
                        weather.put("dressingAdvice", generateDressingAdvice(today.getString("dayweather"), today.getString("daytemp")));
                        return weather;
                    }
                }
            }
        } catch (Exception e) {
            log.warn("天气查询异常: {}", e.getMessage());
        }
        return buildMockWeather(cityName);
    }

    private Map<String, Object> buildMockWeather(String city) {
        Map<String, Object> mock = new HashMap<>();
        mock.put("city", city);
        mock.put("date", LocalDate.now().toString());
        mock.put("weather", "晴");
        mock.put("temperatureHigh", "26");
        mock.put("temperatureLow", "16");
        mock.put("dressingAdvice", "天气舒适，建议穿着轻便");
        return mock;
    }

    private String generateDressingAdvice(String weather, String temp) {
        try {
            int t = Integer.parseInt(temp);
            if (t >= 30) return "炎热，穿短袖、注意防晒";
            if (t >= 22) return "舒适，推荐薄外套或长袖";
            if (t >= 15) return "微凉，建议外套";
            return "较冷，注意保暖";
        } catch (Exception e) {
            return "天气舒适，建议穿着轻便";
        }
    }

    // ==================== 3. 酒店搜索 ====================
    public List<Map<String, Object>> searchHotelsNearby(BigDecimal lat, BigDecimal lng, String cityName, int radius, int limit) {
        List<Map<String, Object>> hotels = new ArrayList<>();
        if (amapKey == null || amapKey.isBlank()) {
            return buildMockHotels(cityName, limit);
        }

        try {
            // 周边搜索
            if (lat != null && lng != null) {
                String url = AMAP_PLACE_AROUND_URL + "?key=" + amapKey
                        + "&location=" + lng + "," + lat
                        + "&keywords=" + URLEncoder.encode("酒店", StandardCharsets.UTF_8)
                        + "&types=060000"
                        + "&radius=" + radius
                        + "&offset=" + limit;
                String resp = restTemplate.getForObject(url, String.class);
                hotels = parseHotelResponse(resp, cityName);
                if (!hotels.isEmpty()) {
                    log.info("周边搜索到 {} 家酒店", hotels.size());
                    return hotels;
                }
            }

            // 城市文本搜索
            String adcode = CITY_ADCODE.getOrDefault(cityName, cityName);
            String url = AMAP_PLACE_TEXT_URL + "?key=" + amapKey
                    + "&keywords=" + URLEncoder.encode("酒店", StandardCharsets.UTF_8)
                    + "&city=" + URLEncoder.encode(adcode, StandardCharsets.UTF_8)
                    + "&citylimit=true"
                    + "&offset=" + limit;
            String resp = restTemplate.getForObject(url, String.class);
            hotels = parseHotelResponse(resp, cityName);
            log.info("城市搜索到 {} 家酒店", hotels.size());

        } catch (Exception e) {
            log.error("酒店搜索异常: {}", e.getMessage());
        }

        return hotels.isEmpty() ? buildMockHotels(cityName, limit) : hotels;
    }

    // ==================== 4. 景点搜索 ====================
    public List<Map<String, Object>> searchAttractionsNearby(BigDecimal lat, BigDecimal lng, String cityName, int radius, int limit) {
        List<Map<String, Object>> attractions = new ArrayList<>();
        if (amapKey == null || amapKey.isBlank()) {
            return buildMockAttractions(cityName, limit);
        }

        try {
            // 周边搜索
            if (lat != null && lng != null) {
                String url = AMAP_PLACE_AROUND_URL + "?key=" + amapKey
                        + "&location=" + lng + "," + lat
                        + "&keywords=" + URLEncoder.encode("旅游景点", StandardCharsets.UTF_8)
                        + "&types=风景名胜|旅游景区|博物馆|公园"
                        + "&radius=" + radius
                        + "&offset=" + limit;
                String resp = restTemplate.getForObject(url, String.class);
                attractions = parseAttractionResponse(resp, cityName);
                if (!attractions.isEmpty()) {
                    log.info("周边搜索到 {} 个景点", attractions.size());
                    return attractions;
                }
            }

            // 城市文本搜索
            String adcode = CITY_ADCODE.getOrDefault(cityName, cityName);
            String url = AMAP_PLACE_TEXT_URL + "?key=" + amapKey
                    + "&keywords=" + URLEncoder.encode("旅游景点", StandardCharsets.UTF_8)
                    + "&types=风景名胜|旅游景区|博物馆|公园|广场"
                    + "&city=" + URLEncoder.encode(adcode, StandardCharsets.UTF_8)
                    + "&citylimit=true"
                    + "&offset=" + limit;
            String resp = restTemplate.getForObject(url, String.class);
            attractions = parseAttractionResponse(resp, cityName);
            log.info("城市搜索到 {} 个景点", attractions.size());

        } catch (Exception e) {
            log.error("景点搜索异常: {}", e.getMessage());
        }

        return attractions.isEmpty() ? buildMockAttractions(cityName, limit) : attractions;
    }

    private List<Map<String, Object>> parseHotelResponse(String response, String cityName) {
        List<Map<String, Object>> hotels = new ArrayList<>();
        try {
            JSONObject json = JSONObject.parseObject(response);
            if (!"1".equals(json.getString("status"))) {
                return hotels;
            }
            JSONArray pois = json.getJSONArray("pois");
            if (pois == null || pois.isEmpty()) {
                return hotels;
            }

            // 需要过滤的关键词（非酒店）
            List<String> excludeKeywords = Arrays.asList("茶", "咖啡", "餐厅", "美食",
                    "BA·", "BA(", "饮品", "小吃", "面包", "蛋糕", "奶茶");

            for (int i = 0; i < pois.size(); i++) {
                JSONObject poi = pois.getJSONObject(i);

                String name = poi.getString("name");
                String type = poi.getString("type");

                // 过滤：type必须包含住宿服务，或者排除非酒店关键词
                if (type == null || !type.contains("住宿服务")) {
                    // 如果type不包含住宿服务，检查名称是否包含排除关键词
                    boolean shouldSkip = false;
                    for (String kw : excludeKeywords) {
                        if (name != null && name.contains(kw)) {
                            shouldSkip = true;
                            break;
                        }
                    }
                    if (shouldSkip) {
                        log.debug("过滤非酒店POI: {} - {}", name, type);
                        continue;
                    }
                }

                Map<String, Object> hotel = new LinkedHashMap<>();
                hotel.put("name", name);
                hotel.put("address", poi.getString("address"));
                hotel.put("distance", poi.getString("distance"));

                JSONObject bizExt = poi.getJSONObject("biz_ext");
                int starRating = 3;
                if (bizExt != null) {
                    String rating = bizExt.getString("rating");
                    if (rating != null) {
                        try {
                            starRating = (int) Double.parseDouble(rating);
                        } catch (Exception e) {}
                    }
                }
                hotel.put("starRating", starRating);
                hotel.put("priceRange", "¥200-500");
                hotel.put("meituanUrl", buildMeituanHotelUrl(name, cityName));
                hotel.put("source", "amap");
                hotels.add(hotel);
            }
            log.info("解析到 {} 家酒店", hotels.size());
        } catch (Exception e) {
            log.error("解析酒店数据失败: {}", e.getMessage());
        }
        return hotels;
    }

    // ==================== 修复后的 parseAttractionResponse ====================
    private List<Map<String, Object>> parseAttractionResponse(String response, String cityName) {
        List<Map<String, Object>> attractions = new ArrayList<>();
        try {
            JSONObject json = JSONObject.parseObject(response);
            if (!"1".equals(json.getString("status"))) {
                log.warn("景点API返回失败: {}", json.getString("info"));
                return attractions;
            }
            JSONArray pois = json.getJSONArray("pois");
            if (pois == null || pois.isEmpty()) {
                log.warn("景点API返回空数组");
                return attractions;
            }

            log.info("高德返回 {} 条POI数据", pois.size());

            for (int i = 0; i < pois.size(); i++) {
                JSONObject poi = pois.getJSONObject(i);

                String name = poi.getString("name");
                String address = poi.getString("address");
                String adname = poi.getString("adname");
                String type = poi.getString("type");
                String distance = poi.getString("distance");

                // 过滤：只保留景点类型的POI（不再过滤城市，因为高德API已经限制了）
                if (type == null) continue;
                if (!(type.contains("风景") || type.contains("公园") ||
                        type.contains("广场") || type.contains("博物馆") ||
                        type.contains("景区") || type.contains("寺庙") ||
                        type.contains("名胜"))) {
                    log.debug("过滤非景点POI: {} - {}", name, type);
                    continue;
                }

                Map<String, Object> attraction = new LinkedHashMap<>();
                attraction.put("name", name);
                attraction.put("address", address);
                attraction.put("distance", distance != null ? distance : "未知");
                attraction.put("type", type);

                // 从 biz_ext 获取评分和开放时间
                JSONObject bizExt = poi.getJSONObject("biz_ext");
                if (bizExt != null) {
                    String rating = bizExt.getString("rating");
                    if (rating != null) {
                        attraction.put("rating", rating);
                    }
                    String openTime = bizExt.getString("open_time");
                    if (openTime != null && !openTime.isEmpty()) {
                        attraction.put("openTime", openTime);
                    }
                }

                attraction.put("recommendedDuration", estimateDuration(name));
                attraction.put("meituanUrl", buildMeituanScenicUrl(name, cityName));
                attraction.put("source", "amap");
                attractions.add(attraction);
                log.info("解析到景点: {} - {}", name, address);
            }
            log.info("最终解析到 {} 个景点", attractions.size());
        } catch (Exception e) {
            log.error("解析景点数据失败: {}", e.getMessage(), e);
        }
        return attractions;
    }

    // ==================== 7. 美团链接生成 ====================
    private String buildMeituanHotelUrl(String hotelName, String cityName) {
        String keyword = hotelName + " " + cityName;
        try {
            String encoded = URLEncoder.encode(keyword, StandardCharsets.UTF_8);
            return "imeituan://www.meituan.com/hotel/search?keyword=" + encoded;
        } catch (Exception e) {
            return "https://i.meituan.com/awp/h5/hotel/search.html?keyword=" + keyword;
        }
    }

    private String buildMeituanScenicUrl(String scenicName, String cityName) {
        String keyword = scenicName + " " + cityName;
        try {
            String encoded = URLEncoder.encode(keyword, StandardCharsets.UTF_8);
            return "imeituan://www.meituan.com/scenic/search?keyword=" + encoded;
        } catch (Exception e) {
            return "https://i.meituan.com/awp/h5/scenic/search.html?keyword=" + keyword;
        }
    }

    // ==================== 8. 辅助方法 ====================
    private String estimateDuration(String name) {
        if (name == null) return "2-3小时";
        if (name.contains("博物馆") || name.contains("纪念馆")) return "2-3小时";
        if (name.contains("公园") || name.contains("广场")) return "1-2小时";
        if (name.contains("山") || name.contains("景区")) return "3-4小时";
        if (name.contains("寺") || name.contains("庙")) return "1-2小时";
        return "2小时";
    }

    // ==================== 9. Mock降级（仅在API失败时使用） ====================
    private List<Map<String, Object>> buildMockHotels(String cityName, int limit) {
        List<Map<String, Object>> mock = new ArrayList<>();
        String[] hotelNames = {
                cityName + "海景大酒店", cityName + "中心假日酒店",
                cityName + "国际饭店", cityName + "希尔顿酒店", cityName + "香格里拉大酒店"
        };
        for (int i = 0; i < Math.min(limit, hotelNames.length); i++) {
            Map<String, Object> hotel = new LinkedHashMap<>();
            hotel.put("name", hotelNames[i]);
            hotel.put("address", cityName + "市中心路段" + (i+1) + "号");
            hotel.put("distance", String.valueOf(800 + i * 300));
            hotel.put("starRating", 4);
            hotel.put("priceRange", "¥300-800");
            hotel.put("meituanUrl", buildMeituanHotelUrl(hotelNames[i], cityName));
            hotel.put("source", "mock");
            mock.add(hotel);
        }
        return mock;
    }

    private List<Map<String, Object>> buildMockAttractions(String cityName, int limit) {
        List<Map<String, Object>> mock = new ArrayList<>();
        // 真实景点数据（仅当API完全失败时使用）
        Map<String, String[]> cityAttractions = new HashMap<>();
        cityAttractions.put("青岛", new String[]{"五四广场", "青岛奥帆中心", "海滨风景区", "青岛啤酒博物馆", "信号山公园", "小鱼山公园"});
        cityAttractions.put("北京", new String[]{"故宫", "长城", "天坛", "颐和园", "圆明园", "鸟巢"});
        cityAttractions.put("上海", new String[]{"外滩", "东方明珠", "迪士尼", "豫园", "新天地", "田子坊"});
        cityAttractions.put("西安", new String[]{"兵马俑", "大雁塔", "城墙", "大唐不夜城", "回民街", "华清宫"});
        cityAttractions.put("成都", new String[]{"宽窄巷子", "锦里", "武侯祠", "杜甫草堂", "青城山", "都江堰"});
        cityAttractions.put("洛阳", new String[]{"龙门石窟", "白马寺", "洛阳博物馆", "洛邑古城", "应天门", "洛阳老街"});

        String[] attractions = cityAttractions.getOrDefault(cityName,
                new String[]{cityName + "城市广场", cityName + "博物馆", cityName + "公园"});

        for (int i = 0; i < Math.min(limit, attractions.length); i++) {
            Map<String, Object> attraction = new LinkedHashMap<>();
            attraction.put("name", attractions[i]);
            attraction.put("address", cityName + "市景区路" + (i+1));
            attraction.put("distance", String.valueOf(1000 + i * 500));
            attraction.put("recommendedDuration", "2-3小时");
            attraction.put("meituanUrl", buildMeituanScenicUrl(attractions[i], cityName));
            attraction.put("source", "mock");
            mock.add(attraction);
        }
        return mock;
    }
}