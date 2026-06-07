package com.concert.agent;

import com.concert.entity.Concert;
import com.concert.service.ConcertService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 演唱会相关工具 - 用于通用AI助手模式
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ConcertTools {

    private final ConcertService concertService;

    @Tool(name = "getAllSingers", description = "获取所有歌手列表，用于用户查询有哪些歌手开演唱会")
    public String getAllSingers() {
        log.info("工具调用: 获取所有歌手列表");
        List<Concert> concerts = concertService.list();
        
        if (concerts == null || concerts.isEmpty()) {
            return "暂无演唱会信息。";
        }

        // 提取唯一的歌手名
        List<String> singers = concerts.stream()
                .map(Concert::getSinger)
                .distinct()
                .sorted()
                .collect(Collectors.toList());

        StringBuilder sb = new StringBuilder("**当前热门歌手演唱会**\n\n");
        for (int i = 0; i < singers.size(); i++) {
            sb.append(String.format("%d. %s\n", i + 1, singers.get(i)));
        }
        sb.append("\n请告诉我您想看哪位歌手的演唱会，我可以为您规划行程、推荐座位、查询周边美食酒店等！");

        return sb.toString();
    }

    @Tool(name = "getSingerConcerts", description = "获取指定歌手的所有演唱会信息")
    public String getSingerConcerts(
            @ToolParam(description = "歌手名称，如：汪苏泷") String singer) {
        log.info("工具调用: 获取歌手演唱会 singer={}", singer);

        List<Concert> concerts = concertService.findBySinger(singer);

        if (concerts == null || concerts.isEmpty()) {
            return String.format("未找到 %s 的演唱会信息。您可以：\n1. 使用 getAllSingers 查看所有歌手\n2. 确认歌手名称是否正确", singer);
        }

        StringBuilder sb = new StringBuilder();
        sb.append(String.format("**%s 演唱会信息**\n\n", singer));

        for (int i = 0; i < concerts.size(); i++) {
            Concert c = concerts.get(i);
            sb.append(String.format("**场次 %d**\n", i + 1));
            sb.append(String.format("城市：%s\n", c.getCity()));
            sb.append(String.format("场馆：%s\n", c.getVenue()));
            sb.append(String.format("时间：%s\n", c.getShowTime().toLocalDate()));
            sb.append(String.format("票价：%s\n", c.getTicketPrice()));
            sb.append(String.format("状态：%s\n", c.getStatus()));
            sb.append("\n");
        }

        sb.append("请告诉我您想去哪一场，我可以帮您：\n");
        sb.append("- 推荐最佳座位\n");
        sb.append("- 查询场馆周边美食\n");
        sb.append("- 推荐附近酒店\n");
        sb.append("- 规划交通出行\n");
        sb.append("- 制定完整行程\n");

        return sb.toString();
    }

    @Tool(name = "getConcertDetail", description = "获取指定演唱会的详细信息")
    public String getConcertDetail(
            @ToolParam(description = "演唱会ID") Long concertId) {
        log.info("工具调用: 获取演唱会详情 concertId={}", concertId);
        
        Concert concert = concertService.getConcertById(concertId);
        
        if (concert == null) {
            return "未找到该演唱会信息，请确认演唱会ID是否正确。";
        }

        return String.format(
            "**%s 演唱会详情**\n\n" +
            "城市：%s\n" +
            "场馆：%s\n" +
            "时间：%s\n" +
            "票价：%s\n" +
            "状态：%s\n\n" +
            "我可以帮您规划行程、推荐座位、查询周边美食酒店等！",
            concert.getSinger(),
            concert.getCity(),
            concert.getVenue(),
            concert.getShowTime().toLocalDate(),
            concert.getTicketPrice(),
            concert.getStatus()
        );
    }

    @Tool(name = "getAllConcerts", description = "获取所有演唱会列表")
    public String getAllConcerts() {
        log.info("工具调用: 获取所有演唱会列表");
        List<Concert> concerts = concertService.list();
        
        if (concerts == null || concerts.isEmpty()) {
            return "暂无演唱会信息。";
        }

        StringBuilder sb = new StringBuilder("**全部演唱会列表**\n\n");
        for (int i = 0; i < Math.min(10, concerts.size()); i++) {
            Concert c = concerts.get(i);
            sb.append(String.format("%d. **%s** - %s站\n",
                i + 1, c.getSinger(), c.getCity()));
            sb.append(String.format("   时间：%s | 票价：%s | ID: %d\n\n",
                c.getShowTime().toLocalDate(),
                c.getTicketPrice(),
                c.getId()));
        }

        if (concerts.size() > 10) {
            sb.append(String.format("... 还有 %d 场演唱会\n", concerts.size() - 10));
        }

        sb.append("\n请告诉我您想看哪位歌手的演唱会，或者提供演唱会ID！");

        return sb.toString();
    }
}
