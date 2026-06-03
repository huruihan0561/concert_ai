package com.concert.service;

import com.concert.dto.TravelPlanRequestDTO;
import com.concert.vo.TravelPlanVO;

import java.util.Map;

/**
 * AI行程规划服务接口
 */
public interface AiPlanningService {

    /**
     * 生成完整行程攻略
     * @param request 行程规划请求参数（包含演唱会ID、出发城市、出行日期、偏好等）
     * @return 完整的行程攻略（包含演唱会信息、天气、交通、酒店、每日行程等）
     */
    TravelPlanVO generatePlan(TravelPlanRequestDTO request);

    /**
     * 获取场馆3D模型
     * @param venueName 场馆名称
     * @return 3D模型信息（模型URL、座位布局等）
     */
    Map<String, Object> getVenue3D(String venueName);
}