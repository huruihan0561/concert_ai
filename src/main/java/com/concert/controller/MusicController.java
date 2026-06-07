package com.concert.controller;

import com.concert.agent.MusicTools;
import com.concert.vo.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/music")
@Tag(name = "音乐", description = "歌手歌单、情绪推荐等")
@RequiredArgsConstructor
public class MusicController {

    private final MusicTools musicTools;

    @GetMapping("/playlist/{singer}")
    @Operation(summary = "获取歌手歌单", description = "根据歌手名返回经典歌曲列表")
    public Result<List<Map<String, String>>> getPlaylist(
            @PathVariable String singer) {
        List<Map<String, String>> songs = musicTools.getSingerPlaylist(singer);
        return Result.ok(songs);
    }
}