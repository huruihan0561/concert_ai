package com.concert.agent;

import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONArray;
import com.alibaba.fastjson2.JSONObject;
import com.concert.service.MusicService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Component
@RequiredArgsConstructor
@Slf4j
public class MusicTools {

    private final MusicService musicService;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${ai.api.key:}")
    private String aiApiKey;

    @Value("${ai.api.url:https://api.deepseek.com/v1/chat/completions}")
    private String aiApiUrl;

    @Value("${ai.api.model:deepseek-chat}")
    private String aiModel;

    @Tool(name = "getSingerPlaylist", description = "获取指定歌手的歌单")
    public List<Map<String, String>> getSingerPlaylist(
            @ToolParam(description = "歌手名称，如：周杰伦、林俊杰、五月天") String singer) {
        log.info("Tool调用: 获取歌手歌单, singer={}", singer);

        Map<String, Object> playlist = musicService.getPlaylistBySinger(singer);
        List<Map<String, String>> songs = new ArrayList<>();

        if (playlist != null && playlist.containsKey("songs")) {
            @SuppressWarnings("unchecked")
            List<Map<String, String>> songList = (List<Map<String, String>>) playlist.get("songs");
            for (Map<String, String> song : songList) {
                Map<String, String> songMap = new HashMap<>();
                songMap.put("name", song.get("name"));
                songMap.put("artist", song.get("artist"));
                songMap.put("url", song.getOrDefault("url", ""));
                songMap.put("cover", song.getOrDefault("cover", ""));
                songs.add(songMap);
            }
        }

        return songs;
    }

    @Tool(name = "searchSongsByMood", description = "根据情绪或场景搜索歌曲，支持AI智能推荐")
    public List<Map<String, String>> searchSongsByMood(
            @ToolParam(description = "情绪类型：happy(开心)、sad(难过)、sports(运动)、study(学习)、travel(旅行)、nostalgic(怀旧)、sleep(助眠)、concert(演唱会预热)") String mood,
            @ToolParam(description = "用户输入的描述，用于AI理解更深层的需求") String description) {
        log.info("Tool调用: 根据情绪搜索歌曲, mood={}, description={}", mood, description);

        // 如果有用户描述，用AI生成个性化推荐
        if (description != null && !description.isEmpty() && !description.equals(mood)) {
            List<Map<String, String>> aiSongs = getSongsByAI(mood, description);
            if (aiSongs != null && !aiSongs.isEmpty()) {
                return aiSongs;
            }
        }

        // 否则返回预设歌单
        return getMoodPlaylist(mood);
    }

    @Tool(name = "extractSingerFromInput", description = "从用户输入中提取歌手名称")
    public String extractSingerFromInput(
            @ToolParam(description = "用户输入的文本") String input) {
        log.info("Tool调用: 提取歌手名称, input={}", input);

        List<String> singers = Arrays.asList(
                "周杰伦", "林俊杰", "五月天", "邓紫棋", "薛之谦",
                "陈奕迅", "李荣浩", "毛不易", "张杰", "周深",
                "汪苏泷", "许嵩", "蔡徐坤", "华晨宇", "王源",
                "易烊千玺", "王俊凯", "张艺兴", "鹿晗", "黄子韬"
        );

        for (String singer : singers) {
            if (input.contains(singer)) {
                return singer;
            }
        }

        return null;
    }

    /**
     * 用AI生成个性化歌单
     */
    private List<Map<String, String>> getSongsByAI(String mood, String description) {
        try {
            String prompt = String.format(
                    "用户当前心情：%s，用户描述：%s。请推荐5首符合这个心情的中文歌曲。" +
                            "只返回JSON数组，格式：[{\"name\":\"歌名\",\"artist\":\"歌手\"}]，" +
                            "不要有其他任何文字。",
                    mood, description);

            String aiResponse = callAIApi(prompt);
            log.info("AI推荐歌曲响应: {}", aiResponse);

            return parseSongsFromAI(aiResponse);
        } catch (Exception e) {
            log.error("AI推荐失败", e);
            return null;
        }
    }

    /**
     * 调用AI API
     */
    private String callAIApi(String prompt) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + aiApiKey);
            headers.set("Content-Type", "application/json");

            JSONObject requestBody = new JSONObject();
            requestBody.put("model", aiModel);

            JSONArray messages = new JSONArray();
            messages.add(JSONObject.of("role", "system", "content", "你是音乐推荐专家，只返回JSON格式数据"));
            messages.add(JSONObject.of("role", "user", "content", prompt));
            requestBody.put("messages", messages);
            requestBody.put("temperature", 0.7);
            requestBody.put("max_tokens", 1000);

            HttpEntity<String> entity = new HttpEntity<>(requestBody.toString(), headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    aiApiUrl,
                    HttpMethod.POST,
                    entity,
                    String.class
            );

            JSONObject json = JSON.parseObject(response.getBody());
            return json.getJSONArray("choices")
                    .getJSONObject(0)
                    .getJSONObject("message")
                    .getString("content");

        } catch (Exception e) {
            log.error("AI API调用失败", e);
            throw new RuntimeException("AI API调用失败", e);
        }
    }

    /**
     * 解析AI返回的歌曲JSON
     */
    private List<Map<String, String>> parseSongsFromAI(String aiResponse) {
        List<Map<String, String>> songs = new ArrayList<>();
        try {
            String jsonStr = aiResponse;
            if (aiResponse.contains("```json")) {
                jsonStr = aiResponse.split("```json")[1].split("```")[0];
            } else if (aiResponse.contains("```")) {
                jsonStr = aiResponse.split("```")[1].split("```")[0];
            }
            jsonStr = jsonStr.trim();

            JSONArray jsonArray = JSON.parseArray(jsonStr);
            for (int i = 0; i < jsonArray.size(); i++) {
                JSONObject obj = jsonArray.getJSONObject(i);
                Map<String, String> song = new HashMap<>();
                song.put("name", obj.getString("name"));
                song.put("artist", obj.getString("artist"));
                song.put("url", "");
                song.put("cover", "");
                songs.add(song);
            }
        } catch (Exception e) {
            log.error("解析AI返回失败", e);
        }
        return songs;
    }

    /**
     * 预设歌单（降级用）
     */
    private List<Map<String, String>> getMoodPlaylist(String mood) {
        Map<String, List<Map<String, String>>> moodPlaylists = new HashMap<>();

        moodPlaylists.put("happy", Arrays.asList(
                createSong("告白气球", "周杰伦"),
                createSong("小幸运", "田馥甄"),
                createSong("演员", "薛之谦"),
                createSong("光年之外", "邓紫棋")
        ));

        moodPlaylists.put("sad", Arrays.asList(
                createSong("体面", "于文文"),
                createSong("说散就散", "袁娅维"),
                createSong("后来", "刘若英"),
                createSong("消愁", "毛不易")
        ));

        moodPlaylists.put("sports", Arrays.asList(
                createSong("双截棍", "周杰伦"),
                createSong("倔强", "五月天"),
                createSong("怒放的生命", "汪峰"),
                createSong("奔跑", "羽泉")
        ));

        moodPlaylists.put("study", Arrays.asList(
                createSong("稻香", "周杰伦"),
                createSong("平凡之路", "朴树"),
                createSong("夜空中最亮的星", "逃跑计划"),
                createSong("成都", "赵雷")
        ));

        moodPlaylists.put("travel", Arrays.asList(
                createSong("旅行的意义", "陈绮贞"),
                createSong("蓝莲花", "许巍"),
                createSong("海阔天空", "Beyond"),
                createSong("曾经的你", "许巍")
        ));

        moodPlaylists.put("nostalgic", Arrays.asList(
                createSong("十年", "陈奕迅"),
                createSong("晴天", "周杰伦"),
                createSong("江南", "林俊杰"),
                createSong("遇见", "孙燕姿")
        ));

        moodPlaylists.put("sleep", Arrays.asList(
                createSong("天空之城", "久石让"),
                createSong("River Flows in You", "Yiruma"),
                createSong("夜的钢琴曲五", "石进"),
                createSong("神秘园之歌", "Secret Garden")
        ));

        moodPlaylists.put("concert", Arrays.asList(
                createSong("派对动物", "五月天"),
                createSong("离开地球表面", "五月天"),
                createSong("三天三夜", "张惠妹"),
                createSong("最炫民族风", "凤凰传奇")
        ));

        return moodPlaylists.getOrDefault(mood, moodPlaylists.get("happy"));
    }

    private Map<String, String> createSong(String name, String artist) {
        Map<String, String> song = new HashMap<>();
        song.put("name", name);
        song.put("artist", artist);
        song.put("url", "");
        song.put("cover", "");
        return song;
    }
}