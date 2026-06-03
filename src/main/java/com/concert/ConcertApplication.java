package com.concert;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@MapperScan("com.concert.mapper")
@EnableScheduling
public class ConcertApplication {

    public static void main(String[] args) {
        SpringApplication.run(ConcertApplication.class, args);
        System.out.println("🎵 演唱会智能管家启动成功！");
    }
}