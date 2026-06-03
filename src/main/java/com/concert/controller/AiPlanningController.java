package com.concert.controller;

import com.concert.agent.PlanningAgentService;
import com.concert.dto.TravelPlanRequestDTO;
import com.concert.service.AiPlanningService;
import com.concert.vo.Result;
import com.concert.vo.TravelPlanVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * AI行程规划控制器
 * 提供智能行程规划、场馆3D模型等功能
 */
@RestController
@RequestMapping("/api/planning")
@Tag(name = "AI行程规划", description = "智能行程规划相关接口，包括完整攻略生成、AI对话规划、场馆3D模型等")
@RequiredArgsConstructor
public class AiPlanningController {

    private final AiPlanningService aiPlanningService;
    private final PlanningAgentService planningAgentService;

    /**
     * 生成完整行程攻略
     *
     * @param request 行程规划请求参数（包含演唱会ID、出发城市、出行日期、偏好等）
     * @return 完整的行程攻略（包含演唱会信息、天气、交通、酒店、每日行程等）
     */
    @PostMapping("/generate")
    @Operation(
            summary = "生成完整行程攻略",
            description = "根据用户选择的演唱会、出发城市、出行日期等信息，AI自动生成完整的行程攻略，包括交通、住宿、景点推荐等"
    )
    public Result<TravelPlanVO> generatePlan(
            @Parameter(description = "行程规划请求参数", required = true)
            @Valid @RequestBody TravelPlanRequestDTO request) {
        return Result.ok(aiPlanningService.generatePlan(request));
    }


    /**
     * 获取场馆3D模型
     *
     * @param venueName 场馆名称
     * @return 3D模型信息（模型URL、座位布局等）
     */
    @GetMapping("/venue/3d/{venueName}")
    @Operation(
            summary = "获取场馆3D模型",
            description = "根据场馆名称获取对应的3D模型信息，包括模型文件URL、纹理贴图、座位布局等，支持在线预览"
    )
    public Result<Map<String, Object>> getVenue3D(
            @Parameter(description = "场馆名称，如：国家体育场、上海体育场", required = true, example = "国家体育场")
            @PathVariable String venueName) {
        return Result.ok(aiPlanningService.getVenue3D(venueName));
    }

    /**
     * Agent对话请求参数
     */
    @Data
    @Schema(description = "Agent对话请求参数")
    public static class AgentRequest {
        @Schema(description = "用户ID", example = "10001")
        private Long userId;

        @Schema(description = "用户消息内容", example = "我想看周杰伦的演唱会，帮我规划一下行程", required = true)
        private String message;
    }
}