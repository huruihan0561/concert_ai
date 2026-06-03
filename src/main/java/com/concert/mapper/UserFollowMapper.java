package com.concert.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.concert.entity.UserFollowConcert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface UserFollowMapper extends BaseMapper<UserFollowConcert> {

    /**
     * 根据演唱会ID查询关注该演唱会的所有用户ID
     */
    @Select("SELECT user_id FROM user_follow_concert WHERE concert_id = #{concertId}")
    List<Long> selectUserIdsByConcertId(@Param("concertId") Long concertId);

    /**
     * 查询用户是否已关注某演唱会
     */
    @Select("SELECT COUNT(*) FROM user_follow_concert WHERE user_id = #{userId} AND concert_id = #{concertId}")
    int countByUserAndConcert(@Param("userId") Long userId, @Param("concertId") Long concertId);
}