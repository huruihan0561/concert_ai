package com.concert.agent;

import com.concert.entity.Concert;
import com.concert.entity.UserFollowConcert;
import com.concert.entity.UserReminder;
import com.concert.mapper.UserFollowMapper;
import com.concert.service.ConcertService;
import com.concert.service.ReminderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

/**
 * 智能提醒调度器
 * 自动为用户关注的演唱会生成各类提醒
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SmartReminderScheduler {

    private final UserFollowMapper followMapper;
    private final ConcertService concertService;
    private final ReminderService reminderService;
    private final DynamicReminderService dynamicReminderService;

    /**
     * 每5分钟检查一次，为即将开演的演唱会生成提醒
     */
    @Scheduled(fixedRate = 300000)
    public void checkUpcomingConcerts() {
        log.info("开始检查即将开演的演唱会...");

        // 获取所有关注记录
        List<UserFollowConcert> follows = followMapper.selectList(null);

        for (UserFollowConcert follow : follows) {
            try {
                Concert concert = concertService.getConcertById(follow.getConcertId());
                if (concert == null || concert.getShowTime() == null) continue;

                LocalDateTime now = LocalDateTime.now();
                LocalDateTime showTime = concert.getShowTime();
                long daysUntilShow = ChronoUnit.DAYS.between(now, showTime);

                // 检查是否需要生成提醒
                checkAndCreateReminders(follow.getUserId(), concert, daysUntilShow, now);
            } catch (Exception e) {
                log.error("处理关注记录失败: followId={}", follow.getId(), e);
            }
        }
    }

    /**
     * 每分钟检查待发送的提醒，推送到用户
     */
    @Scheduled(fixedRate = 60000)
    public void sendPendingReminders() {
        List<UserReminder> pending = reminderService.getPendingReminders();
        log.info("待发送提醒数量: {}", pending.size());

        for (UserReminder reminder : pending) {
            try {
                // 推送到动态提醒服务（前端轮询获取）
                dynamicReminderService.createReminder(reminder.getUserId(), reminder.getTitle() + "：" + reminder.getContent());

                // 标记已发送
                reminderService.markAsSent(reminder.getId());
                log.info("提醒已发送: userId={}, title={}", reminder.getUserId(), reminder.getTitle());
            } catch (Exception e) {
                log.error("发送提醒失败: reminderId={}", reminder.getId(), e);
            }
        }
    }

    /**
     * 检查并创建各类提醒
     */
    private void checkAndCreateReminders(String userId, Concert concert, long daysUntilShow, LocalDateTime now) {
        List<UserReminder> existingReminders = reminderService.getConcertReminders(userId, concert.getId());

        // 1. 倒计时提醒（7天、3天、1天、当天）
        createCountdownReminder(userId, concert, daysUntilShow, existingReminders);

        // 2. 出行提醒（提前3天）
        createTravelReminder(userId, concert, daysUntilShow, existingReminders);

        // 3. 天气提醒（提前1天）
        createWeatherReminder(userId, concert, daysUntilShow, existingReminders);

        // 4. 开票提醒（模拟：假设开票时间是演唱会前30天）
        createTicketReminder(userId, concert, daysUntilShow, existingReminders);
    }

    /**
     * 创建倒计时提醒
     */
    private void createCountdownReminder(String userId, Concert concert, long daysUntilShow, List<UserReminder> existing) {
        String countdownType = "COUNTDOWN";

        // 7天倒计时
        if (daysUntilShow == 7 && !hasReminder(existing, countdownType, "7天")) {
            createReminder(userId, concert.getId(), countdownType,
                    "演唱会倒计时7天",
                    String.format("您关注的【%s】演唱会将在7天后开演！记得提前安排行程哦～", concert.getSinger()),
                    LocalDateTime.now().plusMinutes(1));
        }

        // 3天倒计时
        if (daysUntilShow == 3 && !hasReminder(existing, countdownType, "3天")) {
            createReminder(userId, concert.getId(), countdownType,
                    "演唱会倒计时3天",
                    String.format("【%s】演唱会只剩3天啦！快检查一下门票、交通、酒店是否都准备好了？", concert.getSinger()),
                    LocalDateTime.now().plusMinutes(1));
        }

        // 1天倒计时
        if (daysUntilShow == 1 && !hasReminder(existing, countdownType, "1天")) {
            createReminder(userId, concert.getId(), countdownType,
                    "演唱会倒计时1天",
                    String.format("明天就是【%s】演唱会啦！今晚早点休息，明天嗨起来！", concert.getSinger()),
                    LocalDateTime.now().plusMinutes(1));
        }

        // 当天提醒
        if (daysUntilShow == 0 && !hasReminder(existing, countdownType, "当天")) {
            createReminder(userId, concert.getId(), countdownType,
                    "演唱会今天开演！",
                    String.format("【%s】演唱会今天开演！记得提前到场，别错过开场哦～场馆：%s", concert.getSinger(), concert.getVenue()),
                    LocalDateTime.now().plusMinutes(1));
        }
    }

    /**
     * 创建出行提醒
     */
    private void createTravelReminder(String userId, Concert concert, long daysUntilShow, List<UserReminder> existing) {
        String travelType = "TRAVEL";

        if (daysUntilShow == 3 && !hasReminder(existing, travelType, null)) {
            createReminder(userId, concert.getId(), travelType,
                    "出行准备提醒",
                    String.format("【%s】演唱会3天后开演，建议您现在：\n1. 预订酒店（美团酒店有优惠）\n2. 查看交通路线\n3. 准备演唱会必备物品", concert.getSinger()),
                    LocalDateTime.now().plusMinutes(1));
        }
    }

    /**
     * 创建天气提醒
     */
    private void createWeatherReminder(String userId, Concert concert, long daysUntilShow, List<UserReminder> existing) {
        String weatherType = "WEATHER";

        if (daysUntilShow == 1 && !hasReminder(existing, weatherType, null)) {
            // 模拟天气信息
            String weatherInfo = getMockWeather(concert.getCity());
            createReminder(userId, concert.getId(), weatherType,
                    "演唱会天气提醒",
                    String.format("【%s】演唱会明天开演！%s天气：%s，建议您根据天气准备合适的穿着和物品。", concert.getSinger(), concert.getCity(), weatherInfo),
                    LocalDateTime.now().plusMinutes(1));
        }
    }

    /**
     * 创建开票提醒（模拟）
     */
    private void createTicketReminder(String userId, Concert concert, long daysUntilShow, List<UserReminder> existing) {
        String ticketType = "TICKET";

        // 假设开票时间是演唱会前30天
        if (daysUntilShow == 30 && !hasReminder(existing, ticketType, null)) {
            createReminder(userId, concert.getId(), ticketType,
                    "演唱会即将开票！",
                    String.format("【%s】演唱会即将开票！记得提前准备好美团App，开票第一时间抢票！", concert.getSinger()),
                    LocalDateTime.now().plusMinutes(1));
        }
    }

    /**
     * 创建提醒
     */
    private void createReminder(String userId, Long concertId, String type, String title, String content, LocalDateTime triggerTime) {
        UserReminder reminder = new UserReminder();
        reminder.setUserId(userId);
        reminder.setConcertId(concertId);
        reminder.setReminderType(type);
        reminder.setTitle(title);
        reminder.setContent(content);
        reminder.setTriggerTime(triggerTime);
        reminderService.createReminder(reminder);
    }

    /**
     * 检查是否已存在某类型的提醒
     */
    private boolean hasReminder(List<UserReminder> reminders, String type, String keyword) {
        for (UserReminder r : reminders) {
            if (r.getReminderType().equals(type)) {
                if (keyword == null || r.getTitle().contains(keyword)) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * 模拟天气信息
     */
    private String getMockWeather(String city) {
        String[] weathers = {"晴朗，气温22-28℃", "多云，气温18-25℃", "阴天，气温15-20℃", "小雨，气温12-18℃"};
        return weathers[(int) (Math.random() * weathers.length)];
    }
}