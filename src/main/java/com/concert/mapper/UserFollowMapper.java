package com.concert.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.concert.entity.UserFollowConcert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import java.util.List;

@Mapper
public interface UserFollowMapper extends BaseMapper<UserFollowConcert> {
    @Select("SELECT CAST(user_id AS UNSIGNED) FROM user_follow_concert WHERE concert_id = #{concertId}")
    List<Long> selectUserIdsByConcertId(@Param("concertId") Long concertId);

    @Select("SELECT COUNT(*) FROM user_follow_concert WHERE user_id = #{userId} AND concert_id = #{concertId}")
    int countByUserAndConcert(@Param("userId") String userId, @Param("concertId") Long concertId);
}