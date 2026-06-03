package com.concert.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.concert.entity.Scenic;
import org.apache.ibatis.annotations.*;

import java.util.List;

public interface ScenicMapper extends BaseMapper<Scenic> {
    /**
     * 根据城市和偏好查询景点，preference 语义映射：
     * 景点打卡/打卡 → 人文 或 自然
     * 美食 → 美食
     * 夜景 → 夜景
     * 购物 → 购物
     * 自然 → 自然
     * 人文 → 人文
     */
    @Select("<script>" +
            "SELECT * FROM scenic WHERE city_id = (SELECT id FROM city_info WHERE city_name = #{city}) " +
            "<if test='category != null and category != \"\"'>" +
            "  AND (" +
            "    category LIKE CONCAT('%', #{category}, '%')" +
            "    <if test='category == \"景点打卡\" or category == \"打卡\" or category == \"景点\"'> OR category IN ('人文','自然') </if>" +
            "  )" +
            "</if>" +
            " ORDER BY popularity DESC LIMIT 10" +
            "</script>")
    List<Scenic> selectByCityAndCategory(@Param("city") String city, @Param("category") String category);
}