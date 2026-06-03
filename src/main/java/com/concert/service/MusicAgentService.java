package com.concert.service;

import com.concert.service.MusicService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class MusicAgentService {

    private final MusicService musicService;

    /**
     * 根据用户输入推荐歌曲
     * @param input 用户输入的自然语言
     * @return 推荐结果
     */
    public Map<String, Object> recommend(String input) {
        return recommend(null, input);
    }

    /**
     * 根据情绪/场景或用户输入推荐歌曲
     * @param mood 情绪类型
     * @param input 用户输入
     * @return 推荐结果
     */
    public Map<String, Object> recommend(String mood, String input) {
        Map<String, Object> result = new HashMap<>();

        String text = (input != null && !input.isEmpty()) ? input : "";

        // 1. 检查是否提到歌手
        String singer = extractSinger(text);
        if (singer != null) {
            result.put("type", "singer");
            result.put("singer", singer);
            result.put("message", singer + "的热门歌曲来啦～");
            result.put("songs", musicService.getPlaylistBySinger(singer).get("songs"));
            return result;
        }

        // 2. 优先使用指定的情绪
        String detectedMood = mood;
        if (detectedMood == null || detectedMood.isEmpty()) {
            detectedMood = detectMood(text);
        }

        result.put("type", "mood");
        result.put("mood", detectedMood);
        result.put("message", getMoodMessage(detectedMood));
        result.put("songs", getMoodPlaylist(detectedMood));

        return result;
    }

    /**
     * 获取歌手歌单
     * @param singer 歌手名称
     * @return 歌单信息
     */
    public Map<String, Object> getSingerPlaylist(String singer) {
        log.info("获取歌手歌单: singer={}", singer);
        return musicService.getPlaylistBySinger(singer);
    }

    /**
     * 获取所有情绪/场景类型列表
     * @return 情绪类型列表
     */
    public List<Map<String, Object>> getMoods() {
        return Arrays.asList(
                Map.of("key", "happy", "name", "开心", "icon", "😊", "description", "欢快的音乐让你心情更好"),
                Map.of("key", "sad", "name", "难过", "icon", "😢", "description", "治愈系音乐陪你度过低潮"),
                Map.of("key", "sports", "name", "运动", "icon", "🏃", "description", "燃脂BGM，动起来"),
                Map.of("key", "study", "name", "学习", "icon", "📚", "description", "轻音乐伴你专注"),
                Map.of("key", "travel", "name", "旅行", "icon", "✈️", "description", "旅途中的最佳伴侣"),
                Map.of("key", "nostalgic", "name", "怀旧", "icon", "💭", "description", "经典老歌带你回忆"),
                Map.of("key", "sleep", "name", "助眠", "icon", "🌙", "description", "轻柔旋律伴你入眠"),
                Map.of("key", "concert", "name", "演唱会预热", "icon", "🎤", "description", "先听经典，现场更嗨")
        );
    }

    /**
     * 从输入中提取歌手名
     */
    private String extractSinger(String input) {
        List<String> singers = Arrays.asList(
                "周杰伦", "林俊杰", "五月天", "邓紫棋", "薛之谦",
                "陈奕迅", "张杰", "蔡依林", "李荣浩", "毛不易",
                "汪苏泷", "凤凰传奇", "梁静茹", "王力宏", "大张伟",
                "陈粒", "徐良", "黄丽玲", "马思唯", "范玮琪"
        );
        for (String singer : singers) {
            if (input.contains(singer)) {
                return singer;
            }
        }
        return null;
    }

    /**
     * 检测情绪
     */
    private String detectMood(String input) {
        if (input.contains("开心") || input.contains("高兴") || input.contains("快乐")) return "happy";
        if (input.contains("难过") || input.contains("伤心") || input.contains("emo")) return "sad";
        if (input.contains("运动") || input.contains("跑步") || input.contains("健身")) return "sports";
        if (input.contains("学习") || input.contains("看书") || input.contains("专注")) return "study";
        if (input.contains("旅行") || input.contains("路上")) return "travel";
        if (input.contains("怀旧") || input.contains("回忆")) return "nostalgic";
        if (input.contains("睡觉") || input.contains("助眠") || input.contains("晚安")) return "sleep";
        if (input.contains("演唱会") || input.contains("预热")) return "concert";
        return "happy";
    }

    /**
     * 获取情绪对应的消息
     */
    private String getMoodMessage(String mood) {
        Map<String, String> messages = new HashMap<>();
        messages.put("happy", "心情不错，来点欢快的音乐吧！");
        messages.put("sad", "别难过，音乐是最好的治愈～");
        messages.put("sports", "动起来！让音乐陪你燃烧卡路里");
        messages.put("study", "专注时刻，轻音乐伴你学习");
        messages.put("travel", "旅行路上，音乐是最好的伙伴");
        messages.put("nostalgic", "怀念过去，经典老歌带你回忆");
        messages.put("sleep", "晚安，让音乐陪你入眠");
        messages.put("concert", "演唱会预热！先听听歌手的经典曲目吧");
        return messages.getOrDefault(mood, "享受音乐时光");
    }

    /**
     * 获取情绪对应的歌单
     */
    private List<Map<String, String>> getMoodPlaylist(String mood) {
        Map<String, List<Map<String, String>>> playlists = new HashMap<>();

        playlists.put("happy", Arrays.asList(
                createSong("告白气球", "周杰伦"),
                createSong("小幸运", "田馥甄"),
                createSong("恋爱ing", "五月天"),
                createSong("光年之外", "邓紫棋")
        ));
        playlists.put("sad", Arrays.asList(
                createSong("十年", "陈奕迅"),
                createSong("演员", "薛之谦"),
                createSong("后来", "刘若英"),
                createSong("消愁", "毛不易")
        ));
        playlists.put("sports", Arrays.asList(
                createSong("逆战", "张杰"),
                createSong("倔强", "五月天"),
                createSong("双截棍", "周杰伦"),
                createSong("奔跑", "羽泉")
        ));
        playlists.put("study", Arrays.asList(
                createSong("稻香", "周杰伦"),
                createSong("平凡之路", "朴树"),
                createSong("夜空中最亮的星", "逃跑计划"),
                createSong("成都", "赵雷")
        ));
        playlists.put("travel", Arrays.asList(
                createSong("旅行的意义", "陈绮贞"),
                createSong("蓝莲花", "许巍"),
                createSong("曾经的你", "许巍"),
                createSong("海阔天空", "Beyond")
        ));
        playlists.put("nostalgic", Arrays.asList(
                createSong("晴天", "周杰伦"),
                createSong("江南", "林俊杰"),
                createSong("遇见", "孙燕姿"),
                createSong("十年", "陈奕迅")
        ));
        playlists.put("sleep", Arrays.asList(
                createSong("天空之城", "久石让"),
                createSong("River Flows in You", "Yiruma"),
                createSong("卡农", "帕赫贝尔"),
                createSong("月光", "贝多芬")
        ));
        playlists.put("concert", Arrays.asList(
                createSong("派对动物", "五月天"),
                createSong("离开地球表面", "五月天"),
                createSong("双截棍", "周杰伦"),
                createSong("最炫民族风", "凤凰传奇")
        ));

        return playlists.getOrDefault(mood, playlists.get("happy"));
    }

    /**
     * 创建歌曲对象
     */
    private Map<String, String> createSong(String name, String artist) {
        Map<String, String> song = new HashMap<>();
        song.put("name", name);
        song.put("artist", artist);
        song.put("cover", "https://picsum.photos/100/100?random=" + name.hashCode());
        song.put("url", getSongUrl(name));
        return song;
    }

    /**
     * 获取歌曲播放URL
     */
    private String getSongUrl(String songName) {
        Map<String, String> urlMap = new HashMap<>();
        urlMap.put("告白气球", "https://music.163.com/song/media/outer/url?id=418603077.mp3");
        urlMap.put("晴天", "https://music.163.com/song/media/outer/url?id=186016.mp3");
        urlMap.put("稻香", "https://music.163.com/song/media/outer/url?id=186021.mp3");
        urlMap.put("演员", "https://music.163.com/song/media/outer/url?id=32507038.mp3");
        urlMap.put("十年", "https://music.163.com/song/media/outer/url?id=191394.mp3");
        urlMap.put("光年之外", "https://music.163.com/song/media/outer/url?id=191399.mp3");
        urlMap.put("逆战", "https://music.163.com/song/media/outer/url?id=191409.mp3");
        urlMap.put("倔强", "https://music.163.com/song/media/outer/url?id=191405.mp3");
        return urlMap.getOrDefault(songName, "https://music.163.com/song/media/outer/url?id=186016.mp3");
    }
}