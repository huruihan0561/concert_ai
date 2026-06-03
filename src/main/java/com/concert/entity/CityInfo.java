package com.concert.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("city_info")
public class CityInfo {
    @TableId(type = IdType.AUTO)
    private Long id;

    private String cityName;            // 城市名称
    private String province;            // 省份
    private BigDecimal latitude;        // 纬度
    private BigDecimal longitude;       // 经度
    private String description;         // 城市简介
//
//    @TableField(fill = FieldFill.INSERT)
//    private LocalDateTime createTime;
//
//    @TableField(fill = FieldFill.INSERT_UPDATE)
//    private LocalDateTime updateTime;
}