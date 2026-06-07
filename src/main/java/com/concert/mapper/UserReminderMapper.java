package com.concert.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.concert.entity.UserReminder;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface UserReminderMapper extends BaseMapper<UserReminder> {

    /**
     * 获取用户未读提醒数量
     */
    @Select("SELECT COUNT(*) FROM user_reminder WHERE user_id = #{userId} AND `read` = 0")
    int countUnread(@Param("userId") String userId);

    /**
     * 获取用户未发送的提醒（定时任务使用）
     */
    @Select("SELECT * FROM user_reminder WHERE sent = 0 AND trigger_time <= #{now}")
    List<UserReminder> findPendingReminders(@Param("now") LocalDateTime now);

    /**
     * 获取用户所有提醒（按时间倒序）
     */
    @Select("SELECT * FROM user_reminder WHERE user_id = #{userId} ORDER BY trigger_time DESC LIMIT #{limit}")
    List<UserReminder> findByUserId(@Param("userId") String userId, @Param("limit") int limit);

    /**
     * 获取用户某演唱会的提醒
     */
    @Select("SELECT * FROM user_reminder WHERE user_id = #{userId} AND concert_id = #{concertId}")
    List<UserReminder> findByUserAndConcert(@Param("userId") String userId, @Param("concertId") Long concertId);
}