package com.concert.controller;

import com.concert.agent.DynamicReminderService;
import com.concert.entity.Concert;
import com.concert.entity.UserFollowConcert;
import com.concert.entity.UserReminder;
import com.concert.mapper.UserFollowMapper;
import com.concert.service.ConcertService;
import com.concert.service.ReminderService;
import com.concert.vo.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 用户控制器
 * 提供用户关注、提醒等相关接口
 */
@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
@Tag(name = "用户接口", description = "用户关注、提醒相关接口")
public class UserController {

    private static final Logger log = LoggerFactory.getLogger(UserController.class);

    private final UserFollowMapper userFollowMapper;
    private final ConcertService concertService;
    private final ReminderService reminderService;
    private final DynamicReminderService dynamicReminderService;

    @Data
    public static class FollowRequest {
        private String userId;
        private Long concertId;
    }

    @Data
    public static class FollowConcertVO {
        private Long id;
        private String userId;
        private Long concertId;
        private LocalDateTime followTime;
        private String singer;
        private String city;
        private String venue;
        private String venueAddress;
        private LocalDateTime showTime;
        private String imageUrl;
        private String status;
    }

    @PostMapping("/follow")
    @Operation(summary = "关注演唱会", description = "用户关注指定演唱会")
    public Result<Long> followConcert(@RequestBody FollowRequest request) {
        int count = userFollowMapper.countByUserAndConcert(request.getUserId(), request.getConcertId());
        if (count > 0) {
            return Result.error("已关注该演唱会");
        }

        UserFollowConcert follow = new UserFollowConcert();
        follow.setUserId(request.getUserId());
        follow.setConcertId(request.getConcertId());
        follow.setFollowTime(LocalDateTime.now());

        userFollowMapper.insert(follow);

        // 创建欢迎提醒
        try {
            Concert concert = concertService.getConcertById(request.getConcertId());
            if (concert != null) {
                String title = "关注成功！";
                String content = String.format("您已成功关注【%s】的演唱会！我们会在开票、出行等关键时间点提醒您。", concert.getSinger());
                
                // 创建数据库提醒记录
                UserReminder reminder = new UserReminder();
                reminder.setUserId(request.getUserId());
                reminder.setConcertId(request.getConcertId());
                reminder.setReminderType("FOLLOW");
                reminder.setTitle(title);
                reminder.setContent(content);
                reminder.setTriggerTime(LocalDateTime.now());
                reminderService.createReminder(reminder);
                log.info("创建关注提醒成功: userId={}, concertId={}", request.getUserId(), request.getConcertId());

                // 立即推送到动态提醒服务（前端可立即获取）
                dynamicReminderService.createReminder(request.getUserId(), title + "：" + content);
                log.info("推送关注提醒到Redis成功: userId={}", request.getUserId());
            } else {
                log.warn("未找到演唱会信息: concertId={}", request.getConcertId());
            }
        } catch (Exception e) {
            log.error("创建关注提醒失败: userId={}, concertId={}", request.getUserId(), request.getConcertId(), e);
        }

        return Result.ok(follow.getId());
    }

    @DeleteMapping("/follow/{id}")
    @Operation(summary = "取消关注", description = "取消关注指定演唱会")
    public Result<Void> unfollowConcert(
            @Parameter(description = "关注记录ID", required = true)
            @PathVariable Long id) {
        userFollowMapper.deleteById(id);
        return Result.ok();
    }

    @GetMapping("/follows")
    @Operation(summary = "获取关注列表", description = "获取用户关注的所有演唱会")
    public Result<List<FollowConcertVO>> getUserFollows(
            @Parameter(description = "用户ID", required = true)
            @RequestParam String userId) {
        List<UserFollowConcert> follows = userFollowMapper.selectList(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<UserFollowConcert>()
                        .eq(UserFollowConcert::getUserId, userId)
                        .orderByDesc(UserFollowConcert::getFollowTime)
        );

        List<Long> concertIds = follows.stream()
                .map(UserFollowConcert::getConcertId)
                .distinct()
                .collect(Collectors.toList());

        Map<Long, Concert> concertMap = concertService.getConcertsByIds(concertIds).stream()
                .collect(Collectors.toMap(Concert::getId, Function.identity()));

        List<FollowConcertVO> result = follows.stream()
                .map(follow -> {
                    Concert concert = concertMap.get(follow.getConcertId());
                    FollowConcertVO vo = new FollowConcertVO();
                    vo.setId(follow.getId());
                    vo.setUserId(follow.getUserId());
                    vo.setConcertId(follow.getConcertId());
                    vo.setFollowTime(follow.getFollowTime());
                    if (concert != null) {
                        vo.setSinger(concert.getSinger());
                        vo.setCity(concert.getCity());
                        vo.setVenue(concert.getVenue());
                        vo.setVenueAddress(concert.getVenueAddress());
                        vo.setShowTime(concert.getShowTime());
                        vo.setImageUrl(concert.getImageUrl());
                        vo.setStatus(concert.getStatus());
                    }
                    return vo;
                })
                .sorted(Comparator.comparing(FollowConcertVO::getFollowTime).reversed())
                .collect(Collectors.toList());

        return Result.ok(result);
    }

    @GetMapping("/follow/check")
    @Operation(summary = "检查关注状态", description = "检查用户是否已关注指定演唱会")
    public Result<UserFollowConcert> checkFollowStatus(
            @Parameter(description = "用户ID", required = true) @RequestParam String userId,
            @Parameter(description = "演唱会ID", required = true) @RequestParam Long concertId) {
        UserFollowConcert follow = userFollowMapper.selectOne(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<UserFollowConcert>()
                        .eq(UserFollowConcert::getUserId, userId)
                        .eq(UserFollowConcert::getConcertId, concertId)
        );
        return Result.ok(follow);
    }
}
