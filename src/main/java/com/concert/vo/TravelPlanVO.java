package com.concert.vo;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class TravelPlanVO {
    private ConcertInfo concert;                 // 演唱会信息
    private WeatherInfo weather;                 // 天气信息
    private List<TransportOption> toTransport;   // 去程车次列表
    private List<TransportOption> backTransport; // 返程车次列表
    private List<HotelVO> hotels;                // 酒店推荐列表
    private List<DailyItinerary> dailyItineraries; // 每日行程
    private String summary;                      // 攻略总结
    private String attractionsText;

    /**
     * 演唱会信息
     */
    @Data
    public static class ConcertInfo {
        private Long id;                 // 演唱会ID
        private String singer;           // 歌手
        private String city;             // 城市
        private String venue;            // 场馆名称
        private String venueAddress;     // 场馆地址
        private String showTime;         // 演出时间
        private String weekday;          // 星期几
        private String ticketPrice;      // 票价区间
        private String imageUrl;         // 海报图
        private Long daysLeft;           // 距离演出剩余天数
    }

    /**
     * 天气信息
     */
    @Data
    public static class WeatherInfo {
        private String city;                 // 城市
        private String date;              // 日期
        private String weather;              // 天气状况
        private BigDecimal temperatureHigh;  // 最高温度
        private BigDecimal temperatureLow;   // 最低温度
        private String dressingAdvice;       // 穿衣建议
    }

    /**
     * 交通选项
     */
    @Data
    public static class TransportOption {
        private String type;           // 交通类型: 高铁/动车/火车/驾车/地铁/公交
        private String number;         // 车次号: G1, K1234
        private String fromStation;    // 出发站
        private String toStation;      // 到达站
        private String departureTime;  // 出发时间
        private String arrivalTime;    // 到达时间
        private String duration;       // 行驶时长
        private String price;          // 票价
        private String seatType;       // 座位类型: 二等座/一等座/商务座
        private String provider;       // 运营商/数据来源
        private String bookingUrl;     // 订票链接
    }

    /**
     * 酒店信息
     */
    @Data
    public static class HotelVO {
        private String name;           // 酒店名称
        private String address;        // 酒店地址
        private String distanceKm;     // 距离场馆距离
        private Integer starRating;    // 星级评分 1-5
        private String priceRange;     // 价格区间
        private String imageUrl;       // 酒店图片
        private String bookingUrl;     // 预订链接
        private BigDecimal latitude;   // 纬度
        private BigDecimal longitude;  // 经度
        private String meituanUrl;  // 美团跳转链接
    }

    /**
     * 每日行程
     */
    @Data
    public static class DailyItinerary {
        private Integer day;                  // 第几天
        private LocalDate date;               // 日期
        private String title;                 // 行程标题
        private List<Activity> morning;       // 上午活动
        private List<Activity> afternoon;     // 下午活动
        private List<Activity> evening;       // 晚上活动

        /**
         * 行程活动
         */
        @Data
        public static class Activity {
            private String name;         // 活动名称
            private String address;      // 活动地址
            private String description;  // 活动描述
            private String imageUrl;     // 图片URL
            private String duration;     // 建议时长
            private String meituanUrl;  // 美团跳转链接（景点门票）
        }
    }
}