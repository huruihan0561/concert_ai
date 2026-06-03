package com.concert.dto;

import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

@Data
public class TravelPlanRequestDTO {

    @NotNull(message = "演唱会ID不能为空")
    private Long concertId;           // 演唱会ID

    @NotNull(message = "出发城市不能为空")
    private String departureCity;     // 出发城市

    @NotNull(message = "出发日期不能为空")
    @DateTimeFormat(pattern = "yyyy-MM-dd")
    private LocalDate departureDate;  // 出发日期

    @NotNull(message = "返程日期不能为空")
    @DateTimeFormat(pattern = "yyyy-MM-dd")
    private LocalDate returnDate;     // 返程日期

    private String transportType = "train";  // 出行方式: train(火车/高铁)/driving(驾车)/transit(公交地铁)

    private String budget = "medium";        // 预算: low(经济)/medium(中等)/high(高端)

    private Boolean needPlay = true;         // 是否需要游玩推荐

    private String preference = "景点";      // 游玩偏好: 景点/美食/打卡/夜景/购物/自然

    private String tripType;                // 行程类型: sameDay(当天往返) / overnight(过夜停留)

    private String specialNeeds;            // 特殊需求（选填）
}