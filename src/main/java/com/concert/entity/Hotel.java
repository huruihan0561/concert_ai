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
@TableName("hotel")
public class Hotel {
    @TableId(type = IdType.AUTO)
    private Long id;

    private Long cityId;                // 城市ID
    private String hotelName;           // 酒店名称
    private String address;             // 地址
    private String imageUrl;            // 图片
    private Integer starRating;         // 星级 1-5
    private String priceRange;          // 价格区间
    private BigDecimal latitude;        // 纬度
    private BigDecimal longitude;       // 经度
    private BigDecimal distanceToVenueKm; // 距场馆公里数
    private String sourceUrl;           // 来源URL/预订URL

//    @TableField(fill = FieldFill.INSERT)
//    private LocalDateTime createTime;
//
//    @TableField(fill = FieldFill.INSERT_UPDATE)
//    private LocalDateTime updateTime;
}