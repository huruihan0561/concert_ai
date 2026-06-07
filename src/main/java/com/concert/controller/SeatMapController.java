package com.concert.controller;

import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONObject;
import com.concert.entity.Concert;
import com.concert.service.ConcertService;
import com.concert.vo.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/seatmap")
@Tag(name = "座位图", description = "演唱会2.5D座位图可视化接口")
@RequiredArgsConstructor
@Slf4j
public class SeatMapController {

    private final ConcertService concertService;

    /**
     * 获取演唱会座位图配置
     * @param concertId 演唱会ID
     * @return 座位图配置（背景图 + 热区区域）
     */
    @GetMapping("/{concertId}")
    @Operation(summary = "获取座位图配置", description = "返回演唱会座位图的背景图片URL和热区区域数据")
    public Result<Map<String, Object>> getSeatMap(@PathVariable Long concertId) {
        Concert concert = concertService.getConcertById(concertId);
        if (concert == null) {
            return Result.error("演唱会不存在");
        }

        // 1. 尝试从 JSON 配置文件加载座位图数据
        Map<String, Object> seatMapData = loadSeatMapFromJson(concertId);

        if (seatMapData != null) {
            // 补充演唱会基本信息
            seatMapData.put("concertId", concert.getId());
            seatMapData.put("singer", concert.getSinger());
            seatMapData.put("venue", concert.getVenue());
            seatMapData.put("showTime", concert.getShowTime());
            return Result.ok(seatMapData);
        }

        // 2. 没有配置文件时，返回基础信息（无热区）
        Map<String, Object> fallback = new HashMap<>();
        fallback.put("concertId", concert.getId());
        fallback.put("singer", concert.getSinger());
        fallback.put("venue", concert.getVenue());
        fallback.put("showTime", concert.getShowTime());
        fallback.put("hasSeatMap", false);
        fallback.put("message", "该演唱会座位图暂未配置，请关注后续更新");
        return Result.ok(fallback);
    }

    /**
     * 从 resources/seatmap_configs/ 目录加载座位图配置
     */
    private Map<String, Object> loadSeatMapFromJson(Long concertId) {
        try {
            String path = "seatmap_configs/" + concertId + ".json";
            ClassPathResource resource = new ClassPathResource(path);
            if (!resource.exists()) {
                log.debug("座位图配置文件不存在: {}", path);
                return null;
            }
            String content = new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            JSONObject json = JSON.parseObject(content);

            Map<String, Object> result = new HashMap<>();
            result.put("concertId", json.getLong("concertId"));
            result.put("singer", json.getString("singer"));
            result.put("venue", json.getString("venue"));
            result.put("backgroundImage", json.getString("backgroundImage"));
            result.put("areas", json.getJSONArray("areas"));
            result.put("hasSeatMap", true);

            return result;
        } catch (Exception e) {
            log.warn("加载座位图配置失败: concertId={}", concertId, e);
            return null;
        }
    }
}