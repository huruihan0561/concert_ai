package com.concert.service;

import com.concert.dto.TransportSearchDTO;
import com.concert.vo.TransportRoundTripVO;
import com.concert.vo.TransportVO;
import java.util.List;

public interface TransportService {

    /**
     * 查询去程车次
     */
    List<TransportVO> searchDepartureTrains(TransportSearchDTO request);

    /**
     * 查询返程车次
     */
    List<TransportVO> searchReturnTrains(TransportSearchDTO request);

    /**
     * 查询往返车次（同时返回去程和返程）
     */
    TransportRoundTripVO searchRoundTrip(TransportSearchDTO request);
}