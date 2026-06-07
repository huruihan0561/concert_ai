package com.concert.controller;

import com.concert.entity.UserReminder;
import com.concert.service.ReminderService;
import com.concert.vo.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 提醒管理接口
 */
@RestController
@RequestMapping("/api/reminders")
@Tag(name = "提醒管理", description = "用户提醒相关接口")
@RequiredArgsConstructor
public class ReminderManageController {

    private final ReminderService reminderService;

    @GetMapping("/list")
    @Operation(summary = "获取用户提醒列表", description = "获取用户的所有提醒，按时间倒序排列")
    public Result<List<UserReminder>> getReminders(
            @Parameter(description = "用户ID", required = true)
            @RequestParam String userId,
            @Parameter(description = "数量限制，默认50")
            @RequestParam(defaultValue = "50") int limit) {
        List<UserReminder> reminders = reminderService.getUserReminders(userId, limit);
        return Result.ok(reminders);
    }

    @GetMapping("/unread-count")
    @Operation(summary = "获取未读提醒数量", description = "获取用户未读提醒的数量")
    public Result<Integer> getUnreadCount(
            @Parameter(description = "用户ID", required = true)
            @RequestParam String userId) {
        int count = reminderService.countUnread(userId);
        return Result.ok(count);
    }

    @GetMapping("/concert/{concertId}")
    @Operation(summary = "获取演唱会相关提醒", description = "获取用户某演唱会的所有提醒")
    public Result<List<UserReminder>> getConcertReminders(
            @Parameter(description = "用户ID", required = true)
            @RequestParam String userId,
            @Parameter(description = "演唱会ID", required = true)
            @PathVariable Long concertId) {
        List<UserReminder> reminders = reminderService.getConcertReminders(userId, concertId);
        return Result.ok(reminders);
    }

    @PostMapping("/create")
    @Operation(summary = "创建提醒", description = "手动创建一个提醒")
    public Result<UserReminder> createReminder(@RequestBody UserReminder reminder) {
        UserReminder created = reminderService.createReminder(reminder);
        return Result.ok(created);
    }

    @PutMapping("/{id}/read")
    @Operation(summary = "标记提醒已读", description = "将指定提醒标记为已读")
    public Result<Void> markAsRead(
            @Parameter(description = "提醒ID", required = true)
            @PathVariable Long id) {
        reminderService.markAsRead(id);
        return Result.ok();
    }

    @PutMapping("/read-all")
    @Operation(summary = "标记所有提醒已读", description = "将用户所有提醒标记为已读")
    public Result<Void> markAllAsRead(
            @Parameter(description = "用户ID", required = true)
            @RequestParam String userId) {
        reminderService.markAllAsRead(userId);
        return Result.ok();
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "删除提醒", description = "删除指定提醒")
    public Result<Void> deleteReminder(
            @Parameter(description = "提醒ID", required = true)
            @PathVariable Long id) {
        reminderService.deleteReminder(id);
        return Result.ok();
    }

    @DeleteMapping("/concert/{concertId}")
    @Operation(summary = "删除演唱会相关提醒", description = "删除用户某演唱会的所有提醒")
    public Result<Void> deleteConcertReminders(
            @Parameter(description = "用户ID", required = true)
            @RequestParam String userId,
            @Parameter(description = "演唱会ID", required = true)
            @PathVariable Long concertId) {
        reminderService.deleteConcertReminders(userId, concertId);
        return Result.ok();
    }
}