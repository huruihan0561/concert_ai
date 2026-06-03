package com.concert.mapper;

import com.concert.entity.Hotel;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.math.BigDecimal;
import java.util.List;

public interface HotelMapper {

    @Select("SELECT *, (ST_DISTANCE_SPHERE(POINT(longitude, latitude), POINT(#{lng}, #{lat})) / 1000) AS distance " +
            "FROM hotel WHERE city_id = (SELECT id FROM city_info WHERE city_name = #{city}) " +
            "HAVING distance < #{radiusKm} ORDER BY distance LIMIT 20")
    List<Hotel> selectNearbyHotels(@Param("city") String city,
                                   @Param("lat") BigDecimal lat,
                                   @Param("lng") BigDecimal lng,
                                   @Param("radiusKm") Double radiusKm);

    @Select("SELECT * FROM hotel WHERE city_id = (SELECT id FROM city_info WHERE city_name = #{city}) " +
            "ORDER BY distance_to_venue_km LIMIT 20")
    List<Hotel> selectByCityOrderByDistance(@Param("city") String city);


    @Select("SELECT * FROM hotel WHERE city_id = (SELECT id FROM city_info WHERE city_name = #{city})")
    List<Hotel> selectByCity(@Param("city") String city);

    @Select("<script>SELECT * FROM hotel WHERE city_id = (SELECT id FROM city_info WHERE city_name = #{city}) " +
            "<if test='budget == \"low\"'> AND (price_range LIKE '%150%' OR price_range LIKE '%200%' OR price_range LIKE '%300%')</if>" +
            "<if test='budget == \"medium\"'> AND (price_range LIKE '%300%' OR price_range LIKE '%400%' OR price_range LIKE '%500%' OR price_range LIKE '%600%')</if>" +
            "<if test='budget == \"high\"'> AND (price_range LIKE '%600%' OR price_range LIKE '%800%' OR price_range LIKE '%1000%' OR price_range LIKE '%1200%')</if>" +
            "<if test='budget == \"luxury\"'> AND (price_range LIKE '%1200%' OR price_range LIKE '%1500%' OR price_range LIKE '%2000%')</if>" +
            " ORDER BY distance_to_venue_km LIMIT 20</script>")
    List<Hotel> selectByCityAndBudget(@Param("city") String city, @Param("budget") String budget);
}