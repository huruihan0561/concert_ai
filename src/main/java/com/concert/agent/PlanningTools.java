package com.concert.agent;


import com.alibaba.fastjson2.JSON;
import com.concert.entity.Concert;
import com.concert.service.ConcertService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

@Component
@RequiredArgsConstructor
@Slf4j
public class PlanningTools {

    private final ConcertService concertService;

    // ==================== 美团核心工具 ====================

    @Tool(name = "searchMeituanFood", description = "查询演唱会场馆周边的美团美食推荐（外卖/到店）")
    public String searchMeituanFood(
            @ToolParam(description = "城市名称，如：北京") String city,
            @ToolParam(description = "场馆名称（可选）") String venue) {
        log.info("美团工具调用: 周边美食 city={}, venue={}", city, venue);
        List<Map<String, String>> foods = generateMockFoods(city);
        StringBuilder sb = new StringBuilder("**周边美食推荐** \n\n");
        for (int i = 0; i < Math.min(5, foods.size()); i++) {
            Map<String, String> f = foods.get(i);
            sb.append(String.format("%d. **%s**  %s  |  价格：%s  |  距离场馆：%s\n",
                    i+1, f.get("name"), f.get("type"), f.get("price"), f.get("distance")));
            sb.append(String.format("   [美团外卖](imeituan://food?name=%s)  |  [到店团购](imeituan://deal?name=%s)\n",
                    f.get("name"), f.get("name")));
        }
        sb.append("\n回复「美食」可查看更多，或直接打开美团App搜索「").append(venue != null ? venue : city).append("周边美食」。");
        return sb.toString();
    }

    @Tool(name = "searchMeituanHotel", description = "查询美团酒店推荐（演唱会场馆附近）")
    public String searchMeituanHotel(
            @ToolParam(description = "城市名称") String city,
            @ToolParam(description = "场馆名称（可选）") String venue) {
        log.info("美团工具调用: 酒店推荐 city={}, venue={}", city, venue);
        List<Map<String, String>> hotels = generateMockHotels(city);
        StringBuilder sb = new StringBuilder("**酒店推荐** \n\n");
        for (int i = 0; i < Math.min(5, hotels.size()); i++) {
            Map<String, String> h = hotels.get(i);
            sb.append(String.format("%d. **%s**  %s  |  价格：%s  |  距离场馆：%s\n",
                    i+1, h.get("name"), h.get("type"), h.get("price"), h.get("distance")));
            sb.append(String.format("   [美团预订](imeituan://hotel?id=%s)\n", h.get("id")));
        }
        sb.append("\n回复「酒店」可查更多，或打开美团App比价预订~");
        return sb.toString();
    }

    @Tool(name = "searchMeituanTickets", description = "查询美团门票（演唱会门票信息）")
    public String searchMeituanTickets(
            @ToolParam(description = "演唱会ID（可选）") Long concertId,
            @ToolParam(description = "歌手名称（可选）") String singer) {
        log.info("美团工具调用: 门票查询 concertId={}, singer={}", concertId, singer);
        Concert concert = null;
        if (concertId != null) concert = concertService.getConcertById(concertId);
        if (concert == null && singer != null) {
            concert = new Concert();
            concert.setSinger(singer);
            concert.setCity("待定");
            concert.setTicketPrice("380-1280");
            concert.setShowTime(LocalDate.now().plusMonths(1).atStartOfDay());
        }
        if (concert == null) {
            return "未找到该演唱会信息，请提供正确歌手名或演唱会ID。";
        }
        return String.format(
                "**%s演唱会门票** \n\n" +
                        "城市：%s\n" +
                        "时间：%s\n" +
                        "票价区间：%s\n\n" +
                        "[立即抢票](imeituan://ticket?keyword=%s) | 支持美团支付\n\n" +
                        "设置开抢提醒：回复「提醒我抢票」~",
                concert.getSinger(), concert.getCity(),
                concert.getShowTime().toLocalDate(), concert.getTicketPrice(),
                concert.getSinger());
    }

    @Tool(name = "estimateMeituanRide", description = "预估美团打车费用和时长")
    public String estimateMeituanRide(
            @ToolParam(description = "起点（如：北京南站）") String origin,
            @ToolParam(description = "终点（如：国家体育场）") String destination) {
        log.info("美团工具调用: 打车预估 from={} to={}", origin, destination);
        int distanceKm = ThreadLocalRandom.current().nextInt(3, 20);
        int price = 10 + distanceKm * 2;
        int duration = distanceKm * 2 + 5;
        return String.format(
                "**美团打车预估** \n\n" +
                        "从 %s 到 %s\n" +
                        "距离约 %d km，预计 %d 分钟\n" +
                        "预估费用 %d - %d 元（含动态调价）\n\n" +
                        "[打开美团打车](imeituan://ride?from=%s&to=%s)",
                origin, destination, distanceKm, duration, price-3, price+3, origin, destination);
    }

    @Tool(name = "createMeituanReminder", description = "设置美团开抢提醒（演唱会门票预售/开抢提醒）")
    public String createMeituanReminder(
            @ToolParam(description = "演唱会ID") Long concertId) {
        Concert concert = concertService.getConcertById(concertId);
        if (concert == null) return "未找到演唱会，无法设置提醒。";
        log.info("美团提醒创建: concertId={}", concertId);
        return String.format(
                "已为您设置 **%s** 演唱会美团开抢提醒！\n\n" +
                        "开抢前30分钟，美团App会通过通知提醒您~\n" +
                        "您也可在美团App「我的-抢票提醒」中查看。",
                concert.getSinger());
    }

    // ==================== 辅助工具 ====================

    @Tool(name = "getWeather", description = "查询城市天气（模拟）")
    public String getWeather(@ToolParam(description = "城市名称") String cityName) {
        String[] weathers = {"晴", "多云", "阴", "小雨", "阵雨"};
        String weather = weathers[ThreadLocalRandom.current().nextInt(weathers.length)];
        int high = ThreadLocalRandom.current().nextInt(20, 35);
        int low = high - ThreadLocalRandom.current().nextInt(5, 12);
        return String.format("**%s天气** %s，气温 %d~%d℃，湿度65%%，建议%s。",
                cityName, weather, low, high, high > 30 ? "注意防暑" : "舒适出行");
    }

    @Tool(name = "searchTrains", description = "查询火车票（模拟）")
    public String searchTrains(
            @ToolParam(description = "出发城市") String from,
            @ToolParam(description = "到达城市") String to,
            @ToolParam(description = "日期（yyyy-MM-dd）") String date) {
        String[] trains = {"G123", "G456", "D789", "K101"};
        String train = trains[ThreadLocalRandom.current().nextInt(trains.length)];
        int price = ThreadLocalRandom.current().nextInt(150, 600);
        return String.format("**火车票查询** \n\n从 %s 到 %s 的火车票：\n车次 %s，出发08:00，到达12:30，二等座 %d元~\n（更多车次请使用12306或美团火车票）",
                from, to, train, price);
    }

    // ==================== Mock 数据 ====================

    private List<Map<String, String>> generateMockFoods(String city) {
        List<Map<String, String>> list = new ArrayList<>();
        String[][] data = {
                {"海底捞火锅", "火锅", "¥120/人", "500m"},
                {"肯德基", "快餐", "¥35/人", "200m"},
                {"星巴克", "咖啡", "¥38/人", "300m"},
                {"必胜客", "西餐", "¥80/人", "400m"},
                {"兰州拉面", "面食", "¥25/人", "150m"},
                {"奈雪的茶", "茶饮", "¥28/人", "600m"},
                {"小龙坎老火锅", "火锅", "¥110/人", "800m"},
        };
        for (String[] d : data) {
            Map<String, String> m = new HashMap<>();
            m.put("name", d[0]);
            m.put("type", d[1]);
            m.put("price", d[2]);
            m.put("distance", d[3]);
            list.add(m);
        }
        Collections.shuffle(list);
        return list;
    }

    private List<Map<String, String>> generateMockHotels(String city) {
        List<Map<String, String>> list = new ArrayList<>();
        String[][] data = {
                {"全季酒店", "舒适型", "¥350起", "1.2km", "H001"},
                {"如家快捷酒店", "经济型", "¥180起", "800m", "H002"},
                {"希尔顿逸林", "豪华型", "¥880起", "2.5km", "H003"},
                {"亚朵酒店", "中高端", "¥450起", "1.5km", "H004"},
                {"汉庭酒店", "经济型", "¥160起", "600m", "H005"},
        };
        for (String[] d : data) {
            Map<String, String> m = new HashMap<>();
            m.put("name", d[0]);
            m.put("type", d[1]);
            m.put("price", d[2]);
            m.put("distance", d[3]);
            m.put("id", d[4]);
            list.add(m);
        }
        return list;
    }

    @Tool(name = "getSeatInfo", description = "查询演唱会的座位图信息和选座建议。当用户询问座位推荐、选座建议、哪个区域好时，必须调用此工具获取座位配置信息。")
    public String getSeatInfo(
            @ToolParam(description = "演唱会ID") Long concertId,
            @ToolParam(description = "区域名称（可选），如：A1区、VIP区、看台区") String areaName) {

        Concert concert = concertService.getConcertById(concertId);
        if (concert == null) {
            return "未找到该演唱会信息";
        }

        // 尝试加载座位图配置
        Map<String, Object> seatMap = loadSeatMapFromJson(concertId);
        if (seatMap == null) {
            return String.format("【%s】%s\n票价区间：%s\n座位图暂未上线，建议关注大麦/美团查看实时选座。",
                    concert.getSinger(), concert.getVenue(), concert.getTicketPrice());
        }

        String singer = (String) seatMap.getOrDefault("singer", concert.getSinger());
        String venue = (String) seatMap.getOrDefault("venue", concert.getVenue());
        var areas = (List<Map<String, Object>>) seatMap.get("areas");

        if (areaName != null && !areaName.isBlank()) {
            // 查询特定区域详情
            for (Map<String, Object> area : areas) {
                if (area.get("name").toString().contains(areaName) ||
                        area.get("id").toString().equalsIgnoreCase(areaName)) {
                    return String.format("**%s - %s** \n\n票价：%s\n%s\n[查看座位图](https://yourdomain.com/seatmap/%d)",
                            singer, area.get("name"),
                            area.get("priceRange"), area.get("description"), concertId);
                }
            }
            return String.format("未找到区域「%s」，可选区域：%s",
                    areaName, areas.stream().map(a -> a.get("name").toString()).toList());
        }

        // 返回所有座位区域信息
        StringBuilder sb = new StringBuilder();
        sb.append(String.format("**%s演唱会座位信息** \n\n", singer));
        sb.append(String.format("场馆：%s\n\n", venue));
        sb.append("**可选区域：**\n\n");

        for (Map<String, Object> area : areas) {
            sb.append(String.format("**%s** %s\n  %s\n\n",
                    area.get("name"),
                    area.get("priceRange"),
                    area.get("description")));
        }

        sb.append("**选座建议：**\n\n");
        sb.append("- 追求最佳视野：选择内场前排区域（如A1区、VIP区）\n");
        sb.append("- 性价比之选：看台前排或二层区域\n");
        sb.append("- 经济实惠：山顶区或高层看台\n\n");
        sb.append(String.format("[查看完整座位图](https://yourdomain.com/seatmap/%d)", concertId));

        return sb.toString();
    }

    // 从 seatmap_configs 目录加载座位配置
    private Map<String, Object> loadSeatMapFromJson(Long concertId) {
        try {
            String path = "seatmap_configs/" + concertId + ".json";
            ClassPathResource resource = new ClassPathResource(path);
            if (!resource.exists()) return null;
            String content = new String(resource.getInputStream().readAllBytes());
            return JSON.parseObject(content);
        } catch (Exception e) {
            log.warn("加载座位配置失败: concertId={}", concertId, e);
            return null;
        }
    }
}
