package com.concert.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@TableName("weather_info")
public class WeatherInfo {
    @TableId(type = IdType.AUTO)
    private Long id;

    private String city;                // 城市
    private LocalDate date;             // 日期
    private String weather;             // 天气
    private BigDecimal temperatureHigh; // 最高温度
    private BigDecimal temperatureLow;  // 最低温度
    private String dressingAdvice;      // 穿衣建议

//    @TableField(fill = FieldFill.INSERT)
//    private LocalDateTime createTime;
//
//    @TableField(fill = FieldFill.INSERT_UPDATE)
//    private LocalDateTime updateTime;
}