package com.concert.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.concert.entity.Playlist;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface PlaylistMapper extends BaseMapper<Playlist> {
    @Select("SELECT * FROM playlist WHERE singer_name = #{singerName}")
    Playlist selectBySingerName(@Param("singerName") String singerName);
}