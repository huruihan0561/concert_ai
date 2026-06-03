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
@TableName("scenic")
public class Scenic {
    @TableId(type = IdType.AUTO)
    private Long id;

    private Long cityId;                // 城市ID
    private String spotName;            // 景点名称
    private String imageUrl;            // 图片
    private String category;            // 类别：自然/人文/娱乐/购物/美食/夜景
    private String address;             // 地址
    private String ticketPrice;         // 票价
    private String openTime;            // 开放时间
    private String duration;            // 建议游玩时长
    private Integer popularity;         // 热门度
    private String description;         // 景点描述
    private BigDecimal latitude;        // 纬度
    private BigDecimal longitude;       // 经度

//    @TableField(fill = FieldFill.INSERT)
//    private LocalDateTime createTime;
//
//    @TableField(fill = FieldFill.INSERT_UPDATE)
//    private LocalDateTime updateTime;
}