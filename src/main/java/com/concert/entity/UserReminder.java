package com.concert.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 用户提醒实体
 */
@Data
@TableName("user_reminder")
public class UserReminder {
    @TableId(type = IdType.AUTO)
    private Long id;
    
    /** 用户ID */
    private String userId;
    
    /** 演唱会ID */
    private Long concertId;
    
    /** 提醒类型：TICKET(开票提醒), PRICE(价格变动), TRAVEL(出行提醒), WEATHER(天气提醒), COUNTDOWN(倒计时) */
    private String reminderType;
    
    /** 提醒标题 */
    private String title;
    
    /** 提醒内容 */
    private String content;
    
    /** 提醒触发时间 */
    private LocalDateTime triggerTime;
    
    /** 是否已发送 */
    private Boolean sent;
    
    /** 是否已读 */
    @TableField("`read`")
    private Boolean read;
    
    /** 创建时间 */
    private LocalDateTime createTime;
    
    /** 额外数据（JSON格式，如价格变动详情） */
    private String extraData;
}