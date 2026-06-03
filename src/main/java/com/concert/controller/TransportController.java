// controller/TransportController.java
package com.concert.controller;

import com.concert.dto.TransportSearchDTO;
import com.concert.service.TransportService;
import com.concert.vo.Result;
import com.concert.vo.TransportRoundTripVO;
import com.concert.vo.TransportVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/transport")
@Tag(name = "交通车次查询接口")
@RequiredArgsConstructor
public class TransportController {

    private final TransportService transportService;

    @PostMapping("/search/departure")
    @Operation(summary = "查询去程车次")
    public Result<List<TransportVO>> searchDeparture(@Valid @RequestBody TransportSearchDTO request) {
        return Result.ok(transportService.searchDepartureTrains(request));
    }

    @PostMapping("/search/return")
    @Operation(summary = "查询返程车次")
    public Result<List<TransportVO>> searchReturn(@Valid @RequestBody TransportSearchDTO request) {
        return Result.ok(transportService.searchReturnTrains(request));
    }

    @PostMapping("/search/roundtrip")
    @Operation(summary = "查询往返车次（推荐）", description = "同时查询去程和返程车次")
    public Result<TransportRoundTripVO> searchRoundTrip(@Valid @RequestBody TransportSearchDTO request) {
        return Result.ok(transportService.searchRoundTrip(request));
    }
}