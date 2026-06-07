package com.concert.service;

import com.concert.entity.UserReminder;
import com.concert.mapper.UserReminderMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 提醒服务
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ReminderService {

    private final UserReminderMapper reminderMapper;

    /**
     * 创建提醒
     */
    public UserReminder createReminder(UserReminder reminder) {
        reminder.setCreateTime(LocalDateTime.now());
        reminder.setSent(false);
        reminder.setRead(false);
        reminderMapper.insert(reminder);
        log.info("创建提醒: userId={}, type={}, title={}", reminder.getUserId(), reminder.getReminderType(), reminder.getTitle());
        return reminder;
    }

    /**
     * 批量创建提醒
     */
    public void createReminders(List<UserReminder> reminders) {
        for (UserReminder reminder : reminders) {
            createReminder(reminder);
        }
    }

    /**
     * 获取用户未读提醒数量
     */
    public int countUnread(String userId) {
        return reminderMapper.countUnread(userId);
    }

    /**
     * 获取用户所有提醒
     */
    public List<UserReminder> getUserReminders(String userId, int limit) {
        return reminderMapper.findByUserId(userId, limit);
    }

    /**
     * 获取用户某演唱会的提醒
     */
    public List<UserReminder> getConcertReminders(String userId, Long concertId) {
        return reminderMapper.findByUserAndConcert(userId, concertId);
    }

    /**
     * 标记提醒已读
     */
    public void markAsRead(Long reminderId) {
        UserReminder reminder = reminderMapper.selectById(reminderId);
        if (reminder != null) {
            reminder.setRead(true);
            reminderMapper.updateById(reminder);
        }
    }

    /**
     * 标记所有提醒已读
     */
    public void markAllAsRead(String userId) {
        List<UserReminder> reminders = reminderMapper.findByUserId(userId, 100);
        for (UserReminder r : reminders) {
            if (!r.getRead()) {
                r.setRead(true);
                reminderMapper.updateById(r);
            }
        }
    }

    /**
     * 删除提醒
     */
    public void deleteReminder(Long reminderId) {
        reminderMapper.deleteById(reminderId);
    }

    /**
     * 删除用户某演唱会的所有提醒
     */
    public void deleteConcertReminders(String userId, Long concertId) {
        List<UserReminder> reminders = reminderMapper.findByUserAndConcert(userId, concertId);
        for (UserReminder r : reminders) {
            reminderMapper.deleteById(r.getId());
        }
    }

    /**
     * 获取待发送的提醒（定时任务使用）
     */
    public List<UserReminder> getPendingReminders() {
        return reminderMapper.findPendingReminders(LocalDateTime.now());
    }

    /**
     * 标记提醒已发送
     */
    public void markAsSent(Long reminderId) {
        UserReminder reminder = reminderMapper.selectById(reminderId);
        if (reminder != null) {
            reminder.setSent(true);
            reminderMapper.updateById(reminder);
        }
    }
}