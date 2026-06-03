package com.concert.controller;

import com.concert.service.MusicAgentService;
import com.concert.vo.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 音乐智能体控制器
 * 提供情绪歌单推荐、歌手歌单查询等功能
 */
@RestController
@RequestMapping("/api/music")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "音乐智能体", description = "基于情绪和场景的音乐推荐、歌手歌单查询等功能")
public class MusicAgentController {

    private final MusicAgentService musicAgentService;

    /**
     * 根据情绪/场景推荐歌曲
     *
     * @param request 推荐请求（包含情绪类型或用户输入）
     * @return 推荐歌曲列表
     */
    @PostMapping("/recommend")
    @Operation(
            summary = "情绪/场景推荐歌曲",
            description = "根据用户的心情（开心、难过、运动等）或场景（学习、旅行、助眠等），AI智能推荐合适的歌曲"
    )
    public Result<Map<String, Object>> recommend(
            @Parameter(description = "歌曲推荐请求参数", required = true)
            @RequestBody RecommendRequest request) {
        log.info("情绪推荐: input={}, mood={}", request.getInput(), request.getMood());
        String mood = request.getMood();
        String input = request.getInput();
        if (mood != null && !mood.isEmpty()) {
            return Result.ok(musicAgentService.recommend(mood, input));
        }
        return Result.ok(musicAgentService.recommend(input));
    }

    /**
     * 获取歌手歌单
     *
     * @param singer 歌手名称
     * @return 歌单信息（包含歌曲列表、播放链接等）
     */
    @GetMapping("/playlist/{singer}")
    @Operation(
            summary = "获取歌手歌单",
            description = "根据歌手名称获取该歌手的经典歌单，包含歌曲名称、歌手、播放链接等信息"
    )
    public Result<Map<String, Object>> getPlaylist(
            @Parameter(description = "歌手名称", required = true, example = "周杰伦")
            @PathVariable String singer) {
        return Result.ok(musicAgentService.getSingerPlaylist(singer));
    }

    /**
     * 获取所有情绪/场景类型
     *
     * @return 情绪类型列表（开心、难过、运动、学习、旅行、怀旧、助眠、演唱会预热）
     */
    @GetMapping("/moods")
    @Operation(
            summary = "获取情绪类型列表",
            description = "获取系统支持的所有情绪/场景类型，用于前端展示选择"
    )
    public Result<List<Map<String, Object>>> getMoods() {
        return Result.ok(musicAgentService.getMoods());
    }

    /**
     * 歌曲推荐请求参数
     */
    @Data
    @Schema(description = "歌曲推荐请求参数")
    public static class RecommendRequest {
        @Schema(description = "用户输入的自然语言描述，如：'我今天很开心'、'运动时听什么歌'", example = "我今天心情很好")
        private String input;

        @Schema(description = "情绪类型：happy(开心)/sad(难过)/sports(运动)/study(学习)/travel(旅行)/nostalgic(怀旧)/sleep(助眠)/concert(演唱会预热)",
                allowableValues = {"happy", "sad", "sports", "study", "travel", "nostalgic", "sleep", "concert"},
                example = "happy")
        private String mood;
    }
}