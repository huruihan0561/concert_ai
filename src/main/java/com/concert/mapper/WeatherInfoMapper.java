package com.concert.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.concert.entity.WeatherInfo;
import org.apache.ibatis.annotations.*;

import java.time.LocalDate;
import java.util.List;

public interface WeatherInfoMapper extends BaseMapper<WeatherInfo> {

    /**
     * 根据城市和日期查询天气
     */
    @Select("SELECT * FROM weather_info WHERE city = #{city} AND date = #{date}")
    WeatherInfo selectByCityAndDate(@Param("city") String city, @Param("date") LocalDate date);

    /**
     * 获取城市未来几天预报
     */
    @Select("SELECT * FROM weather_info WHERE city = #{city} AND date >= #{startDate} " +
           "AND date <= #{endDate} ORDER BY date")
    List<WeatherInfo> selectForecast(@Param("city") String city,
                                    @Param("startDate") LocalDate startDate,
                                    @Param("endDate") LocalDate endDate);

    /**
     * 获取当天天气
     */
    @Select("SELECT * FROM weather_info WHERE city = #{city} AND date = CURRENT_DATE")
    WeatherInfo selectTodayWeather(@Param("city") String city);
}