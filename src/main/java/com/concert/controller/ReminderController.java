package com.concert.controller;

import com.concert.agent.DynamicReminderService;
import com.concert.vo.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/reminders")
@Tag(name = "提醒", description = "用户提醒轮询相关接口")
@RequiredArgsConstructor
public class ReminderController {

    private final DynamicReminderService dynamicReminderService;

    @GetMapping("/due")
    @Operation(summary = "获取未读提醒", description = "轮询获取当前用户未读提醒列表")
    public Result<List<String>> getDueReminders(
            @Parameter(description = "用户ID", required = true)
            @RequestParam String userId) {
        List<String> reminders = new ArrayList<>();
        while (true) {
            String reminder = dynamicReminderService.pollReminder(userId);
            if (reminder == null) {
                break;
            }
            reminders.add(reminder);
        }
        return Result.ok(reminders);
    }

    @PostMapping("/clear")
    @Operation(summary = "清空提醒", description = "清空指定用户所有提醒")
    public Result<Void> clearReminders(
            @Parameter(description = "用户ID", required = true)
            @RequestParam String userId) {
        dynamicReminderService.clearReminders(userId);
        return Result.ok();
    }
}
