package com.concert.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.concert.entity.TransportationOption;
import org.apache.ibatis.annotations.*;

import java.time.LocalDateTime;
import java.util.List;

public interface TransportationOptionMapper extends BaseMapper<TransportationOption> {
    @Select("SELECT * FROM transportation_option WHERE from_city = #{fromCity} " +
            "AND to_city = #{toCity} AND departure_time BETWEEN #{startTime} AND #{endTime} " +
            "AND (#{type} IS NULL OR option_type = #{type}) " +
            "ORDER BY departure_time")
    List<TransportationOption> selectByRoute(@Param("fromCity") String fromCity,
                                             @Param("toCity") String toCity,
                                             @Param("startTime") LocalDateTime startTime,
                                             @Param("endTime") LocalDateTime endTime,
                                             @Param("type") String type);


}