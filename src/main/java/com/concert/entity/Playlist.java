package com.concert.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@TableName("playlist")
public class Playlist {
    @TableId(type = IdType.AUTO)
    private Long id;

    private String singerName;          // 歌手名
    private String songList;            // 歌单(JSON格式)
    private String sourcePlatform;      // 来源平台(网易云/QQ音乐)
    private String sourceUrl;           // 歌单链接

//    @TableField(fill = FieldFill.INSERT)
//    private LocalDateTime createTime;
//
//    @TableField(fill = FieldFill.INSERT_UPDATE)
//    private LocalDateTime updateTime;
}