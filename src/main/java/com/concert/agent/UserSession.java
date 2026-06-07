package com.concert.agent;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.List;

/**
 * 用户会话上下文，记录用户在演唱会管家中的完整状态
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSession implements Serializable {

    private static final long serialVersionUID = 1L;

    private String sessionId;
    private String userId;

    /** 当前选定的演唱会ID */
    private Long concertId;

    /** 身份信息，如"汪苏泷粉丝" */
    private String identity;

    /** 是否带有身份（从演唱会详情页打开） */
    private Boolean hasIdentity;

    /** 当前选定的演唱会歌手 */
    private String selectedSinger;

    /** 演唱会城市 */
    private String concertCity;

    /** 演唱会日期 */
    private LocalDate concertDate;

    /** 出发城市 */
    private String departureCity;

    /** 行程天数 */
    private Integer tripDays;

    /** 预算等级：经济型/舒适型/豪华型 */
    private String budgetLevel;

    /** 用户心情：兴奋/期待/平静/紧张 */
    private String mood;

    /** 用户偏好标签列表，如 ["美食", "夜景", "打卡"] */
    private List<String> preferences;

    /** 最近一次行程规划摘要（用于主动推荐） */
    private String lastPlanSummary;

    /** 用户自定义备注 */
    private String userNote;

    /** 已推荐的歌手对话 sessionId */
    private String celebrityChatSessionId;

    /** 已生成的电台名称 */
    private String generatedRadioName;

    /** 是否开启主动提醒 */
    @Builder.Default
    private Boolean reminderEnabled = true;

    /** 用户头像URL（用于生成合照） */
    private String avatarUrl;

    /** 粉丝注册时间 */
    private LocalDate fanRegisteredDate;

    /** 用户情感标签（由AI分析得出） */
    private List<String> emotionTags;

    /** 演唱会期待值 1-10 */
    private Integer anticipationLevel;
}