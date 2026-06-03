package com.concert.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.concert.entity.VenueModel3D;
import org.apache.ibatis.annotations.*;

import java.util.List;

public interface VenueModel3DMapper extends BaseMapper<VenueModel3D> {

    /**
     * 根据场馆名称查询
     */
    @Select("SELECT * FROM venue_model_3d WHERE venue_name = #{venueName}")
    VenueModel3D selectByVenueName(@Param("venueName") String venueName);

    /**
     * 根据模型类型查询
     */
    @Select("SELECT * FROM venue_model_3d WHERE model_type = #{modelType}")
    List<VenueModel3D> selectByModelType(@Param("modelType") String modelType);

    /**
     * 获取所有可用模型
     */
    @Select("SELECT * FROM venue_model_3d")
    List<VenueModel3D> selectAll();
}