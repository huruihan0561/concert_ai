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
@TableName("venue_model_3d")
public class VenueModel3D {
    @TableId(type = IdType.AUTO)
    private Long id;

    private String venueName;           // 场馆名称
    private String venueCity;           // 所在城市
    private String venueAddress;        // 详细地址
    private String venueDescription;    // 场馆简介
    private BigDecimal latitude;        // 场馆纬度
    private BigDecimal longitude;       // 场馆经度
    private String modelType;           // 模型类型: gltf/obj/fbx/usdz
    private String modelUrl;            // 模型文件URL
    private String textureUrl;          // 纹理贴图URL
    private String thumbnailUrl;        // 缩略图URL
    private String panoramaUrl;         // 全景图URL
    private Integer seatCapacity;       // 总座位数
    private String layoutData;          // 座位布局数据(JSON格式)
    private String facilityPositions;   // 设施位置(JSON格式)
    private String interactionScript;   // 自定义交互脚本(JS)
    private Boolean enableAutoRotate;   // 是否允许自动旋转
    private Boolean enableZoom;         // 是否允许缩放
    private BigDecimal defaultZoomLevel;// 默认缩放级别
    private String status;              // 状态: active/inactive/building
    private Integer version;            // 模型版本号

//    @TableField(fill = FieldFill.INSERT)
//    private LocalDateTime createTime;
//
//    @TableField(fill = FieldFill.INSERT_UPDATE)
//    private LocalDateTime updateTime;
}