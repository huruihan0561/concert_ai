package com.concert.service.impl;

import com.concert.entity.Playlist;
import com.concert.mapper.PlaylistMapper;
import com.concert.service.MusicService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
@RequiredArgsConstructor
public class MusicServiceImpl implements MusicService {
    private final PlaylistMapper playlistMapper;
    @Override
    public Map<String, Object> getPlaylistBySinger(String singer) {
        Playlist entity = playlistMapper.selectBySingerName(singer);
        List<String> songNames = new ArrayList<>();
        if (entity != null && entity.getSongList() != null) {
            // 解析JSON，简单处理
            String[] arr = entity.getSongList().replace("[","").replace("]","").replace("\"","").split(",");
            songNames = Arrays.asList(arr);
        } else {
            songNames = Arrays.asList("晴天", "七里香", "告白气球");
        }
        List<Map<String,String>> songs = new ArrayList<>();
        for (String name : songNames) {
            Map<String,String> m = new HashMap<>();
            m.put("name", name);
            m.put("artist", singer);
            songs.add(m);
        }
        return Map.of("songs", songs);
    }
}