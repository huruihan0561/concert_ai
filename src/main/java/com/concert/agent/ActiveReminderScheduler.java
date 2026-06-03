package com.concert.agent;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.concert.entity.Concert;
import com.concert.mapper.ConcertMapper;
import com.concert.mapper.UserFollowMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Component
@RequiredArgsConstructor
@Slf4j
public class ActiveReminderScheduler {
    private final ConcertMapper concertMapper;
    private final StringRedisTemplate redisTemplate;
    private static final String REMINDER_PREFIX = "reminder:user:";
    private final UserFollowMapper userFollowMapper;

    @Scheduled(cron = "0 0 10 * * ?")
    public void checkUpcomingConcerts() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime end = now.plusDays(7);
        // 查询未来7天内的演唱会
        List<Concert> upcoming = concertMapper.selectList(
                new LambdaQueryWrapper<Concert>()
                        .ge(Concert::getShowTime, now)
                        .le(Concert::getShowTime, end)
        );
        for (Concert c : upcoming) {
            // 查询关注该演唱会的用户
            List<Long> userIds = userFollowMapper.selectUserIdsByConcertId(c.getId());
            for (Long uid : userIds) {
                String msg = String.format("🎤 提醒：%s 演唱会将于 %s 在 %s 举行！还剩 %d 天。",
                        c.getSinger(),
                        c.getShowTime().format(DateTimeFormatter.ofPattern("MM月dd日 HH:mm")),
                        c.getCity(),
                        LocalDate.now().until(c.getShowTime().toLocalDate()).getDays()
                );
                redisTemplate.opsForValue().set("reminder:user:" + uid, msg, 3, TimeUnit.DAYS);
            }
        }
    }

    public String pollReminder(Long userId) {
        String key = REMINDER_PREFIX + userId;
        String reminder = redisTemplate.opsForValue().get(key);
        if (reminder != null) redisTemplate.delete(key);
        return reminder;
    }
}