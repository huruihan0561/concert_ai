package com.concert.service;

import java.util.Map;

public interface MusicService {

    /**
     * 根据歌手名获取歌单
     * @param singer 歌手名称
     * @return 包含歌手信息和歌曲列表的Map
     */
    Map<String, Object> getPlaylistBySinger(String singer);
}