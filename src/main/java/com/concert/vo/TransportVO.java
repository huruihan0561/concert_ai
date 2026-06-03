// vo/TransportVO.java
package com.concert.vo;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class TransportVO {
    private String id;              // 唯一标识
    private String type;            // 交通类型: 高铁/动车/火车/驾车/地铁/公交
    private String number;          // 车次号: G1, K1234
    private String fromStation;     // 出发站
    private String toStation;       // 到达站
    private String departureTime;   // 出发时间
    private String arrivalTime;     // 到达时间
    private String duration;        // 行驶时长
    private String price;           // 票价
    private String seatType;        // 座位类型
    private Integer transferCount;  // 换乘次数
    private String bookingUrl;      // 订票链接
    private Integer score;          // 推荐指数 1-5
}