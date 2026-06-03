package com.concert.vo;

import lombok.Data;
import java.util.List;

@Data
public class TransportRoundTripVO {
    private List<TransportVO> departureTrains;
    private List<TransportVO> returnTrains;
    private String fromCity;
    private String toCity;
    private String departDate;
    private String returnDate;
    private String suggestion;
}