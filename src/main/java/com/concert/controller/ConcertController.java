package com.concert.controller;

import com.concert.entity.Concert;
import com.concert.service.ConcertService;
import com.concert.vo.PageInfo;
import com.concert.vo.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/concerts")
@Tag(name = "演唱会信息", description = "演唱会信息的查询和管理接口")
@RequiredArgsConstructor
public class ConcertController {

    private final ConcertService concertService;

    @GetMapping
    @Operation(summary = "获取演唱会列表", description = "分页查询演唱会，支持按城市和歌手筛选")
    public Result<PageInfo<Concert>> listConcerts(
            @Parameter(description = "城市名称") @RequestParam(required = false) String city,
            @Parameter(description = "歌手名称") @RequestParam(required = false) String singer,
            @Parameter(description = "页码，从0开始") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "每页大小") @RequestParam(defaultValue = "10") int size) {
        return Result.ok(concertService.listConcerts(city, singer, page, size));
    }

    @GetMapping("/{id}")
    @Operation(summary = "获取演唱会详情", description = "根据ID获取演唱会的详细信息")
    public Result<Concert> getConcert(
            @Parameter(description = "演唱会ID", required = true) @PathVariable Long id) {
        Concert concert = concertService.getConcertById(id);
        if (concert == null) {
            return Result.error("演唱会不存在");
        }
        return Result.ok(concert);
    }

    @GetMapping("/singers")
    @Operation(summary = "获取所有歌手列表", description = "获取所有有演唱会的歌手名单")
    public Result<List<String>> getAllSingers() {
        return Result.ok(concertService.getAllSingers());
    }

    @GetMapping("/cities")
    @Operation(summary = "获取城市列表", description = "获取所有有演唱会的城市名单")
    public Result<List<String>> getAllCities() {
        return Result.ok(concertService.getAllCities());
    }
}