package com.concert.agent;

import com.concert.entity.Concert;
import com.concert.mapper.ConcertMapper;
import com.concert.mapper.UserFollowMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class ActiveReminderScheduler {

    private final ConcertMapper concertMapper;
    private final UserFollowMapper userFollowMapper;
    private final DynamicReminderService reminderService;

    @Scheduled(cron = "0 0 10 * * ?")
    public void checkUpcomingConcerts() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime end = now.plusDays(7);
        List<Concert> upcoming = concertMapper.selectList(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<Concert>()
                        .ge(Concert::getShowTime, now)
                        .le(Concert::getShowTime, end)
        );
        for (Concert c : upcoming) {
            List<Long> userIds = userFollowMapper.selectUserIdsByConcertId(c.getId());
            for (Long uid : userIds) {
                String message = String.format(
                        "提醒：%s 演唱会将于 %s 在 %s 举行！还剩 %d 天。",
                        c.getSinger(),
                        c.getShowTime().format(DateTimeFormatter.ofPattern("MM月dd日 HH:mm")),
                        c.getCity(),
                        LocalDate.now().until(c.getShowTime().toLocalDate()).getDays()
                );
                reminderService.createReminder(uid.toString(), message);
                log.info("创建演唱会提醒 userId={} singer={}", uid, c.getSinger());
            }
        }
    }

    public String pollReminder(Long userId) {
        return reminderService.pollReminder(userId.toString());
    }
}