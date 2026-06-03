package com.concert.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@TableName("transportation_option")
public class TransportationOption {
    @TableId(type = IdType.AUTO)
    private Long id;

    private String fromCity;            // 出发城市
    private String toCity;              // 到达城市
    private String optionType;          // 出行方式：train/flight/car
    private LocalDateTime departureTime;// 出发时间
    private LocalDateTime arrivalTime;  // 到达时间
    private BigDecimal price;           // 价格
    private String provider;            // 运营商
    private String seatType;            // 座位类型

    // 以下字段对应SQL表结构
    private String optionNumber;        // 车次/航班号
    private String departureStation;    // 出发站点
    private String arrivalStation;      // 到达站点
    private Integer duration;           // 用时（分钟）
    private String bookingUrl;          // 预订URL
    private Boolean isTransfer;         // 是否中转
    private String transferDetails;     // 中转详情

//    @TableField(fill = FieldFill.INSERT)
//    private LocalDateTime createTime;
//
//    @TableField(fill = FieldFill.INSERT_UPDATE)
//    private LocalDateTime updateTime;
}