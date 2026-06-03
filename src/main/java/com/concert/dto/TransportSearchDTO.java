// dto/TransportSearchDTO.java
package com.concert.dto;

import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

@Data
public class TransportSearchDTO {

    @NotNull(message = "出发城市不能为空")
    private String fromCity;        // 出发城市

    @NotNull(message = "到达城市不能为空")
    private String toCity;          // 到达城市

    @NotNull(message = "出发日期不能为空")
    @DateTimeFormat(pattern = "yyyy-MM-dd")
    private LocalDate departDate;   // 出发日期

    @DateTimeFormat(pattern = "yyyy-MM-dd")
    private LocalDate returnDate;   // 返程日期（可选）

    private String transportType = "train";  // train/driving/transit

    private String preference = "speed";     // speed(最快)/price(最便宜)/transfer(最少换乘)
}