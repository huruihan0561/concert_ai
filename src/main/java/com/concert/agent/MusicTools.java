package com.concert.agent;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
@RequiredArgsConstructor
@Slf4j
public class MusicTools {

    @Tool(name = "getSingerPlaylist", description = "获取指定歌手的歌单")
    public List<Map<String, String>> getSingerPlaylist(
            @ToolParam(description = "歌手名称，如：周杰伦、林俊杰、五月天") String singer) {
        log.info("Tool调用: 获取歌手歌单, singer={}", singer);
        return getMockPlaylist(singer);
    }

    @Tool(name = "searchSongsByMood", description = "根据情绪或场景搜索歌曲")
    public List<Map<String, String>> searchSongsByMood(
            @ToolParam(description = "情绪类型") String mood,
            @ToolParam(description = "用户描述") String description) {
        log.info("Tool调用: 情绪搜索 mood={}", mood);
        return getMoodPlaylist(mood);
    }

    @Tool(name = "extractSingerFromInput", description = "从用户输入中提取歌手名称")
    public String extractSingerFromInput(
            @ToolParam(description = "用户输入的文本") String input) {
        log.info("Tool调用: 提取歌手名称, input={}", input);
        List<String> singers = Arrays.asList(
                "周杰伦", "林俊杰", "五月天", "邓紫棋", "薛之谦",
                "陈奕迅", "李荣浩", "毛不易", "张杰", "周深",
                "汪苏泷", "许嵩", "蔡徐坤", "华晨宇"
        );
        for (String singer : singers) {
            if (input.contains(singer)) return singer;
        }
        return null;
    }

    private List<Map<String, String>> getMockPlaylist(String singer) {
        List<Map<String, String>> songs = new ArrayList<>();
        Map<String, String[]> mockData = Map.of(
                "周杰伦", new String[]{"晴天", "七里香", "告白气球", "稻香", "青花瓷"},
                "林俊杰", new String[]{"曹操", "不为谁而作的歌", "可惜没如果", "修炼爱情"},
                "邓紫棋", new String[]{"光年之外", "泡沫", "倒数", "喜欢你"},
                "薛之谦", new String[]{"演员", "丑八怪", "绅士", "刚刚好"},
                "五月天", new String[]{"突然好想你", "倔强", "恋爱ing", "温柔"}
        );
        String[] songNames = mockData.getOrDefault(singer, new String[]{singer + "代表作品"});
        for (String name : songNames) {
            Map<String, String> song = new HashMap<>();
            song.put("name", name);
            song.put("artist", singer);
            song.put("url", "");
            songs.add(song);
        }
        return songs;
    }

    private List<Map<String, String>> getMoodPlaylist(String mood) {
        Map<String, List<Map<String, String>>> playlists = new HashMap<>();
        playlists.put("happy", List.of(
                createSong("告白气球", "周杰伦"),
                createSong("小幸运", "田馥甄"),
                createSong("恋爱ing", "五月天")
        ));
        playlists.put("sad", List.of(
                createSong("十年", "陈奕迅"),
                createSong("演员", "薛之谦"),
                createSong("后来", "刘若英")
        ));
        return playlists.getOrDefault(mood, playlists.get("happy"));
    }

    private Map<String, String> createSong(String name, String artist) {
        Map<String, String> song = new HashMap<>();
        song.put("name", name);
        song.put("artist", artist);
        song.put("url", "");
        return song;
    }
}