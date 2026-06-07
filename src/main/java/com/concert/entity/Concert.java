package com.concert.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("concert")
public class Concert {
    @TableId(type = IdType.AUTO)
    private Long id;

    private String singer;              // 歌手
    private String city;                // 城市
    private String venue;               // 场馆
    private String venueAddress;        // 场馆地址
    private BigDecimal venueLatitude;   // 场馆纬度
    private BigDecimal venueLongitude;  // 场馆经度
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime showTime;     // 演出时间
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime doorsOpenTime;// 入场时间
    private String ticketPrice;         // 票价区间
    private String status;              // 售票状态
    private String imageUrl;            // 海报图

//    @TableField(fill = FieldFill.INSERT)
//    private LocalDateTime createTime;
//
//    @TableField(fill = FieldFill.INSERT_UPDATE)
//    private LocalDateTime updateTime;

    private String seatMapUrl;


    @TableField("has_2d5_view")
    private Boolean has2d5View;
}