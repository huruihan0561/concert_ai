package com.concert.service;

import com.concert.entity.Concert;
import com.baomidou.mybatisplus.extension.service.IService;
import com.concert.vo.PageInfo;
import java.util.List;

public interface ConcertService extends IService<Concert> {

    /**
     * 分页查询演唱会列表
     */
    PageInfo<Concert> listConcerts(String city, String singer, int page, int size);

    /**
     * 根据ID查询演唱会
     */
    Concert getConcertById(Long id);

    /**
     * 获取所有歌手列表
     */
    List<String> getAllSingers();

    /**
     * 获取所有有演唱会的城市列表
     */
    List<String> getAllCities();
}