package com.concert.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.concert.entity.Concert;
import com.concert.mapper.ConcertMapper;
import com.concert.service.ConcertService;
import com.concert.vo.PageInfo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ConcertServiceImpl extends ServiceImpl<ConcertMapper, Concert> implements ConcertService {

    @Override
    public PageInfo<Concert> listConcerts(String city, String singer, int page, int size) {
        // 构建查询条件
        LambdaQueryWrapper<Concert> wrapper = new LambdaQueryWrapper<>();
        wrapper.ge(Concert::getShowTime, LocalDateTime.now())
                .orderByAsc(Concert::getShowTime);

        if (StringUtils.hasText(city)) {
            wrapper.eq(Concert::getCity, city);
        }
        if (StringUtils.hasText(singer)) {
            wrapper.eq(Concert::getSinger, singer);
        }

        // 查询所有符合条件的
        List<Concert> allConcerts = this.list(wrapper);

        // 手动分页
        int start = page * size;
        int end = Math.min(start + size, allConcerts.size());
        List<Concert> pageList = allConcerts.subList(start, end);

        // 构建分页结果
        PageInfo<Concert> pageInfo = new PageInfo<>();
        pageInfo.setRecords(pageList);
        pageInfo.setTotal(allConcerts.size());
        pageInfo.setCurrent(page + 1);
        pageInfo.setSize(size);
        pageInfo.setPages((long) Math.ceil((double) allConcerts.size() / size));

        return pageInfo;
    }

    @Override
    public Concert getConcertById(Long id) {
        return this.getById(id);
    }

    @Override
    public List<String> getAllSingers() {
        LambdaQueryWrapper<Concert> wrapper = new LambdaQueryWrapper<>();
        wrapper.select(Concert::getSinger)
                .groupBy(Concert::getSinger)
                .orderByAsc(Concert::getSinger);
        return this.list(wrapper).stream()
                .map(Concert::getSinger)
                .collect(Collectors.toList());
    }

    @Override
    public List<String> getAllCities() {
        LambdaQueryWrapper<Concert> wrapper = new LambdaQueryWrapper<>();
        wrapper.select(Concert::getCity)
                .groupBy(Concert::getCity)
                .orderByAsc(Concert::getCity);
        return this.list(wrapper).stream()
                .map(Concert::getCity)
                .collect(Collectors.toList());
    }
}