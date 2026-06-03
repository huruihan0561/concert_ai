package com.concert.service.impl;

import com.concert.dto.TransportSearchDTO;
import com.concert.service.TransportService;
import com.concert.vo.TransportRoundTripVO;
import com.concert.vo.TransportVO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class TransportServiceImpl implements TransportService {

    // 城市对应的火车站
    private static final Map<String, String> CITY_STATION = new HashMap<>();

    // 车次数据缓存
    private static final Map<String, List<TransportVO>> TRAIN_CACHE = new HashMap<>();

    static {
        // 城市车站映射
        CITY_STATION.put("北京", "北京南站");
        CITY_STATION.put("上海", "上海虹桥站");
        CITY_STATION.put("广州", "广州南站");
        CITY_STATION.put("深圳", "深圳北站");
        CITY_STATION.put("成都", "成都东站");
        CITY_STATION.put("杭州", "杭州东站");
        CITY_STATION.put("南京", "南京南站");
        CITY_STATION.put("武汉", "武汉站");
        CITY_STATION.put("西安", "西安北站");
        CITY_STATION.put("重庆", "重庆北站");
        CITY_STATION.put("天津", "天津西站");
        CITY_STATION.put("苏州", "苏州北站");
        CITY_STATION.put("郑州", "郑州东站");
        CITY_STATION.put("长沙", "长沙南站");
        CITY_STATION.put("青岛", "青岛北站");
        CITY_STATION.put("洛阳", "洛阳龙门站");

        // 初始化车次数据
        initTrainData();
    }

    private static void initTrainData() {
        // 北京 -> 上海
        addTrainRoute("北京", "上海", "G1", "07:00", "11:28", "4小时28分", "553");
        addTrainRoute("北京", "上海", "G3", "09:00", "13:28", "4小时28分", "553");
        addTrainRoute("北京", "上海", "G7", "12:00", "16:28", "4小时28分", "553");
        addTrainRoute("北京", "上海", "D709", "19:36", "06:12", "10小时36分", "303");

        // 北京 -> 广州
        addTrainRoute("北京", "广州", "G79", "08:00", "17:38", "9小时38分", "862");
        addTrainRoute("北京", "广州", "G81", "10:00", "19:30", "9小时30分", "862");
        addTrainRoute("北京", "广州", "D901", "20:00", "06:30", "10小时30分", "480");

        // 北京 -> 深圳
        addTrainRoute("北京", "深圳", "G71", "07:30", "17:58", "10小时28分", "936");
        addTrainRoute("北京", "深圳", "D903", "20:15", "06:50", "10小时35分", "520");

        // 北京 -> 成都
        addTrainRoute("北京", "成都", "G87", "09:00", "18:50", "9小时50分", "778");
        addTrainRoute("北京", "成都", "G89", "14:00", "22:30", "8小时30分", "778");
        addTrainRoute("北京", "成都", "K117", "11:10", "17:30", "30小时20分", "236");

        // 北京 -> 杭州
        addTrainRoute("北京", "杭州", "G31", "08:30", "13:28", "4小时58分", "599");
        addTrainRoute("北京", "杭州", "G35", "10:30", "15:38", "5小时8分", "599");
        addTrainRoute("北京", "杭州", "G39", "16:30", "21:25", "4小时55分", "599");

        // 北京 -> 南京
        addTrainRoute("北京", "南京", "G5", "10:00", "13:28", "3小时28分", "443");
        addTrainRoute("北京", "南京", "G13", "14:00", "17:28", "3小时28分", "443");

        // 北京 -> 武汉
        addTrainRoute("北京", "武汉", "G511", "09:00", "13:28", "4小时28分", "520");
        addTrainRoute("北京", "武汉", "G521", "12:00", "16:28", "4小时28分", "520");
        addTrainRoute("北京", "武汉", "G525", "15:00", "19:28", "4小时28分", "520");

        // 北京 -> 西安
        addTrainRoute("北京", "西安", "G651", "08:00", "12:48", "4小时48分", "515");
        addTrainRoute("北京", "西安", "G655", "10:00", "14:48", "4小时48分", "515");
        addTrainRoute("北京", "西安", "G659", "14:00", "18:48", "4小时48分", "515");

        // 北京 -> 郑州
        addTrainRoute("北京", "郑州", "G802", "07:00", "10:28", "3小时28分", "309");
        addTrainRoute("北京", "郑州", "G806", "10:00", "13:28", "3小时28分", "309");
        addTrainRoute("北京", "郑州", "G808", "14:00", "17:28", "3小时28分", "309");

        // 北京 -> 青岛
        addTrainRoute("北京", "青岛", "G206", "07:00", "11:28", "4小时28分", "336");
        addTrainRoute("北京", "青岛", "G208", "10:00", "14:28", "4小时28分", "336");
        addTrainRoute("北京", "青岛", "G210", "14:00", "18:28", "4小时28分", "336");

        // 北京 -> 洛阳
        addTrainRoute("北京", "洛阳", "G652", "07:00", "10:28", "3小时28分", "286");
        addTrainRoute("北京", "洛阳", "G656", "11:00", "14:28", "3小时28分", "286");

        // 上海 -> 杭州
        addTrainRoute("上海", "杭州", "G7351", "06:30", "07:42", "1小时12分", "73");
        addTrainRoute("上海", "杭州", "G7353", "07:30", "08:42", "1小时12分", "73");
        addTrainRoute("上海", "杭州", "G7355", "08:00", "09:12", "1小时12分", "73");

        // 上海 -> 南京
        addTrainRoute("上海", "南京", "G7002", "07:00", "08:16", "1小时16分", "139");
        addTrainRoute("上海", "南京", "G7006", "08:00", "09:16", "1小时16分", "139");
        addTrainRoute("上海", "南京", "G7010", "09:00", "10:16", "1小时16分", "139");

        // 广州 -> 深圳
        addTrainRoute("广州", "深圳", "G6501", "06:30", "07:24", "54分", "74.5");
        addTrainRoute("广州", "深圳", "G6503", "07:30", "08:24", "54分", "74.5");
        addTrainRoute("广州", "深圳", "C7001", "08:00", "09:19", "1小时19分", "79.5");

        // 广州 -> 长沙
        addTrainRoute("广州", "长沙", "G6102", "07:00", "09:38", "2小时38分", "314");
        addTrainRoute("广州", "长沙", "G6104", "08:00", "10:38", "2小时38分", "314");
        addTrainRoute("广州", "长沙", "G6110", "12:00", "14:38", "2小时38分", "314");

        // 成都 -> 重庆
        addTrainRoute("成都", "重庆", "G8601", "07:00", "08:20", "1小时20分", "96.5");
        addTrainRoute("成都", "重庆", "G8603", "08:30", "09:50", "1小时20分", "96.5");
        addTrainRoute("成都", "重庆", "G8605", "10:00", "11:20", "1小时20分", "96.5");
        addTrainRoute("成都", "重庆", "D5102", "14:00", "16:30", "2小时30分", "46");

        // 西安 -> 成都
        addTrainRoute("西安", "成都", "D1918", "07:00", "11:00", "4小时", "263");
        addTrainRoute("西安", "成都", "D1920", "09:00", "13:00", "4小时", "263");
        addTrainRoute("西安", "成都", "G2218", "10:00", "13:30", "3小时30分", "298");
    }

    private static void addTrainRoute(String from, String to, String number,
                                      String departTime, String arriveTime,
                                      String duration, String price) {
        String key = from + "->" + to;
        TransportVO vo = new TransportVO();
        vo.setId(UUID.randomUUID().toString());
        vo.setType(number.startsWith("G") ? "高铁" : (number.startsWith("D") ? "动车" : "快速"));
        vo.setNumber(number);
        vo.setFromStation(CITY_STATION.getOrDefault(from, from + "站"));
        vo.setToStation(CITY_STATION.getOrDefault(to, to + "站"));
        vo.setDepartureTime(departTime);
        vo.setArrivalTime(arriveTime);
        vo.setDuration(duration);
        vo.setPrice("¥" + price);
        vo.setSeatType("二等座");
        vo.setTransferCount(0);
        vo.setBookingUrl("https://www.12306.cn");
        vo.setScore(5);

        TRAIN_CACHE.computeIfAbsent(key, k -> new ArrayList<>()).add(vo);
    }

    @Override
    public List<TransportVO> searchDepartureTrains(TransportSearchDTO request) {
        log.info("查询去程车次: {} -> {}, 日期: {}",
                request.getFromCity(), request.getToCity(), request.getDepartDate());

        if (isSameCity(request.getFromCity(), request.getToCity())) {
            return Collections.emptyList();
        }

        return doSearchTrains(request.getFromCity(), request.getToCity(), request.getPreference());
    }

    @Override
    public List<TransportVO> searchReturnTrains(TransportSearchDTO request) {
        if (request.getReturnDate() == null) {
            return Collections.emptyList();
        }
        log.info("查询返程车次: {} -> {}, 日期: {}",
                request.getToCity(), request.getFromCity(), request.getReturnDate());

        if (isSameCity(request.getToCity(), request.getFromCity())) {
            return Collections.emptyList();
        }

        return doSearchTrains(request.getToCity(), request.getFromCity(), request.getPreference());
    }

    @Override
    public TransportRoundTripVO searchRoundTrip(TransportSearchDTO request) {
        TransportRoundTripVO result = new TransportRoundTripVO();
        result.setFromCity(request.getFromCity());
        result.setToCity(request.getToCity());
        result.setDepartDate(request.getDepartDate().toString());
        result.setReturnDate(request.getReturnDate() != null ? request.getReturnDate().toString() : null);

        // 并行查询去程和返程
        CompletableFuture<List<TransportVO>> departFuture =
                CompletableFuture.supplyAsync(() -> searchDepartureTrains(request));
        CompletableFuture<List<TransportVO>> returnFuture =
                CompletableFuture.supplyAsync(() -> searchReturnTrains(request));

        try {
            result.setDepartureTrains(departFuture.get(5, TimeUnit.SECONDS));
            result.setReturnTrains(returnFuture.get(5, TimeUnit.SECONDS));
        } catch (Exception e) {
            log.error("查询车次失败", e);
            result.setDepartureTrains(Collections.emptyList());
            result.setReturnTrains(Collections.emptyList());
        }

        result.setSuggestion(generateSuggestion(result));
        return result;
    }

    private List<TransportVO> doSearchTrains(String fromCity, String toCity, String preference) {
        String key = fromCity + "->" + toCity;
        List<TransportVO> trains = TRAIN_CACHE.get(key);

        if (trains == null || trains.isEmpty()) {
            log.warn("未找到从 {} 到 {} 的车次数据", fromCity, toCity);
            return generateFallbackTrains(fromCity, toCity);
        }

        // 复制一份，避免修改缓存
        List<TransportVO> result = new ArrayList<>();
        for (TransportVO train : trains) {
            TransportVO copy = new TransportVO();
            copy.setId(UUID.randomUUID().toString());
            copy.setType(train.getType());
            copy.setNumber(train.getNumber());
            copy.setFromStation(train.getFromStation());
            copy.setToStation(train.getToStation());
            copy.setDepartureTime(train.getDepartureTime());
            copy.setArrivalTime(train.getArrivalTime());
            copy.setDuration(train.getDuration());
            copy.setPrice(train.getPrice());
            copy.setSeatType(train.getSeatType());
            copy.setTransferCount(train.getTransferCount());
            copy.setBookingUrl(train.getBookingUrl());
            copy.setScore(train.getScore());
            result.add(copy);
        }

        // 按偏好排序
        sortByPreference(result, preference);

        return result;
    }

    private boolean isSameCity(String city1, String city2) {
        if (city1 == null || city2 == null) return false;
        if (city1.equals(city2)) return true;
        String c1 = city1.replace("市", "");
        String c2 = city2.replace("市", "");
        return c1.equals(c2);
    }

    private List<TransportVO> generateFallbackTrains(String fromCity, String toCity) {
        List<TransportVO> result = new ArrayList<>();
        String fromStation = CITY_STATION.getOrDefault(fromCity, fromCity + "站");
        String toStation = CITY_STATION.getOrDefault(toCity, toCity + "站");
        Random random = new Random();

        TransportVO train1 = new TransportVO();
        train1.setId(UUID.randomUUID().toString());
        train1.setType("高铁");
        train1.setNumber("G" + (1000 + random.nextInt(9000)));
        train1.setFromStation(fromStation);
        train1.setToStation(toStation);
        train1.setDepartureTime("08:00");
        train1.setArrivalTime("12:00");
        train1.setDuration("4小时");
        train1.setPrice("¥" + (200 + random.nextInt(300)));
        train1.setSeatType("二等座");
        train1.setTransferCount(0);
        train1.setBookingUrl("https://www.12306.cn");
        train1.setScore(4);
        result.add(train1);

        TransportVO train2 = new TransportVO();
        train2.setId(UUID.randomUUID().toString());
        train2.setType("动车");
        train2.setNumber("D" + (1000 + random.nextInt(9000)));
        train2.setFromStation(fromStation);
        train2.setToStation(toStation);
        train2.setDepartureTime("10:00");
        train2.setArrivalTime("14:30");
        train2.setDuration("4小时30分");
        train2.setPrice("¥" + (150 + random.nextInt(150)));
        train2.setSeatType("二等座");
        train2.setTransferCount(0);
        train2.setBookingUrl("https://www.12306.cn");
        train2.setScore(3);
        result.add(train2);

        return result;
    }

    private void sortByPreference(List<TransportVO> list, String preference) {
        if ("speed".equals(preference)) {
            list.sort((a, b) -> {
                int aMin = parseDurationToMinutes(a.getDuration());
                int bMin = parseDurationToMinutes(b.getDuration());
                return Integer.compare(aMin, bMin);
            });
        } else if ("price".equals(preference)) {
            list.sort((a, b) -> {
                double aPrice = parsePriceToNumber(a.getPrice());
                double bPrice = parsePriceToNumber(b.getPrice());
                return Double.compare(aPrice, bPrice);
            });
        } else {
            list.sort((a, b) -> Integer.compare(b.getScore(), a.getScore()));
        }
    }

    private int parseDurationToMinutes(String duration) {
        if (duration == null) return 999;
        try {
            int hours = 0, minutes = 0;
            if (duration.contains("小时")) {
                String hoursStr = duration.split("小时")[0];
                hours = Integer.parseInt(hoursStr);
                if (duration.contains("分钟")) {
                    String minPart = duration.split("小时")[1].replace("分钟", "");
                    minutes = Integer.parseInt(minPart);
                }
            } else if (duration.contains("分钟")) {
                minutes = Integer.parseInt(duration.replace("分钟", ""));
            }
            return hours * 60 + minutes;
        } catch (Exception e) {
            return 999;
        }
    }

    private double parsePriceToNumber(String price) {
        if (price == null) return 999;
        try {
            String numStr = price.replace("¥", "").replace("元", "");
            return Double.parseDouble(numStr);
        } catch (Exception e) {
            return 999;
        }
    }

    private String generateSuggestion(TransportRoundTripVO result) {
        StringBuilder sb = new StringBuilder();

        if (result.getDepartureTrains() != null && !result.getDepartureTrains().isEmpty()) {
            TransportVO best = result.getDepartureTrains().get(0);
            sb.append("去程推荐：").append(best.getNumber()).append("，")
                    .append(best.getDepartureTime()).append("出发，")
                    .append(best.getArrivalTime()).append("到达，")
                    .append(best.getDuration()).append("，")
                    .append(best.getPrice()).append("。");
        }

        if (result.getReturnTrains() != null && !result.getReturnTrains().isEmpty()) {
            TransportVO best = result.getReturnTrains().get(0);
            sb.append("返程推荐：").append(best.getNumber()).append("，")
                    .append(best.getDepartureTime()).append("出发，")
                    .append(best.getArrivalTime()).append("到达，")
                    .append(best.getDuration()).append("。");
        }

        sb.append("建议提前7天购票，价格更优惠。");
        return sb.toString();
    }
}