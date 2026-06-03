package com.concert.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("user_follow_concert")
public class UserFollowConcert {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private Long concertId;
    private LocalDateTime followTime;
}