package com.concert.dto;

import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
public class CrawlMessage implements Serializable {
    private static final long serialVersionUID = 1L;

    private String type; // CONCERT, HOTEL, ATTRACTION, RESTAURANT
    private String singer; // 歌手名称（演唱会爬取时）
    private String city; // 城市名称
    private Long targetId; // 目标ID
    private String sourceUrl; // 源URL
    private LocalDateTime createTime;
    private Integer retryCount = 0;
    private String priority = "NORMAL"; // HIGH, NORMAL, LOW

    public CrawlMessage() {
        this.createTime = LocalDateTime.now();
    }

    public CrawlMessage(String type, String city) {
        this();
        this.type = type;
        this.city = city;
    }

    public CrawlMessage(String type, String singer, String city) {
        this(type, city);
        this.singer = singer;
    }
}