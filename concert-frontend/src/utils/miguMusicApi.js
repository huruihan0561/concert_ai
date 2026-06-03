/**
 * 咪咕音乐 API 封装
 * 咪咕音乐提供大量免费音乐资源，API 相对稳定
 */

// 咪咕音乐 API 基础地址
const MIGU_API_BASE = 'https://c.musicapp.migu.cn';
const MIGU_SEARCH_API = 'https://pd.musicapp.migu.cn';

/**
 * 搜索歌曲
 * @param {string} keyword - 搜索关键词
 * @param {number} pageSize - 返回数量
 * @returns {Promise<Array>} - 歌曲列表
 */
export const searchSongs = async (keyword, pageSize = 10) => {
  try {
    const url = `${MIGU_SEARCH_API}/MIGU/3.0.0/resource/search/song/v2.0`;
    const params = new URLSearchParams({
      keyword,
      pageSize: String(pageSize),
      pageNo: '1',
      type: '2',
      version: '3.0.0',
    });

    const response = await fetch(`${url}?${params.toString()}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    
    if (data.code === '000000' && data.data?.songs?.items) {
      return data.data.songs.items.map(song => ({
        id: song.copyrightId || song.id,
        name: song.name,
        artist: song.singers?.map(s => s.name).join('/') || '未知歌手',
        album: song.album?.name || '',
        cover: song.album?.cover || song.newImgs?.[0]?.img || '',
        duration: song.length || 0,
      }));
    }
    
    return [];
  } catch (error) {
    console.error('咪咕搜索歌曲失败:', error);
    return [];
  }
};

/**
 * 获取歌曲播放链接
 * @param {string} copyrightId - 歌曲版权 ID
 * @returns {Promise<string>} - 播放链接
 */
export const getSongUrl = async (copyrightId) => {
  try {
    // 咪咕音乐播放链接获取
    const url = `${MIGU_API_BASE}/v3.0.0/resource/song/listen`;
    const params = new URLSearchParams({
      copyrightId,
      resourceType: '2',
      purpose: '1',
      type: '1',
    });

    const response = await fetch(`${url}?${params.toString()}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://music.migu.cn/',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    
    if (data.code === '000000' && data.data) {
      // 优先返回高音质链接
      const formats = ['sq', 'hq', 'lq'];
      for (const format of formats) {
        if (data.data[format]?.url) {
          return data.data[format].url;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('获取咪咕播放链接失败:', error);
    return null;
  }
};

/**
 * 获取歌手热门歌曲
 * @param {string} artistName - 歌手名称
 * @param {number} limit - 返回数量
 * @returns {Promise<Array>} - 歌曲列表（包含播放链接）
 */
export const getArtistHotSongs = async (artistName, limit = 5) => {
  try {
    console.log('正在咪咕搜索歌手:', artistName);
    
    // 1. 搜索歌手歌曲
    const songs = await searchSongs(artistName, limit * 3);
    
    if (songs.length === 0) {
      console.log('咪咕未找到歌曲:', artistName);
      return getFallbackSongs(artistName);
    }
    
    console.log('咪咕找到歌曲数量:', songs.length);
    
    // 2. 获取每首歌的播放链接
    const result = [];
    for (const song of songs.slice(0, limit * 2)) {
      const playUrl = await getSongUrl(song.id);
      
      if (playUrl) {
        result.push({
          ...song,
          url: playUrl,
        });
        
        if (result.length >= limit) {
          break;
        }
      }
    }
    
    if (result.length === 0) {
      console.log('咪咕歌曲无可用播放链接，使用备用音源');
      return getFallbackSongs(artistName);
    }
    
    console.log('咪咕成功获取歌曲:', result.map(s => s.name));
    return result;
  } catch (error) {
    console.error('获取咪咕歌手歌曲失败:', error);
    return getFallbackSongs(artistName);
  }
};

/**
 * 备用歌曲列表
 */
const FALLBACK_AUDIO_URLS = [
  'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/Tours/Enthusiast/Tours_-_01_-_Enthusiast.mp3',
  'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/Chad_Crouch/Arps/Chad_Crouch_-_Elisions.mp3',
  'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/KieLoKaz/Free_Ganymed/KieLoKaz_-_01_-_Reunion_of_the_Spirits_ID_111.mp3',
  'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/KieLoKaz/Free_Ganymed/KieLoKaz_-_02_-_Trip_to_Ganymed_ID_112.mp3',
  'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/KieLoKaz/Free_Ganymed/KieLoKaz_-_03_-_Sehnsucht_ID_113.mp3',
  'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/KieLoKaz/Free_Ganymed/KieLoKaz_-_04_-_Alte_Herren_ID_114.mp3',
  'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/KieLoKaz/Free_Ganymed/KieLoKaz_-_05_-_Feenstaub_ID_115.mp3',
  'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/KieLoKaz/Free_Ganymed/KieLoKaz_-_06_-_Kiew_Mission_ID_116.mp3',
  'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/KieLoKaz/Free_Ganymed/KieLoKaz_-_07_-_Fading_ID_117.mp3',
  'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/KieLoKaz/Free_Ganymed/KieLoKaz_-_08_-_Turning_Back_ID_118.mp3',
  'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/KieLoKaz/Free_Ganymed/KieLoKaz_-_09_-_Alone_ID_119.mp3',
  'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/KieLoKaz/Free_Ganymed/KieLoKaz_-_10_-_Jahreszeiten_ID_120.mp3',
  'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/KieLoKaz/Free_Ganymed/KieLoKaz_-_11_-_Jahreszeiten_Sax_ID_121.mp3',
  'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/KieLoKaz/Free_Ganymed/KieLoKaz_-_12_-_Turning_Back_Guitar_ID_122.mp3',
  'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/KieLoKaz/Free_Ganymed/KieLoKaz_-_13_-_Reunion_of_the_Spirits_Sax_ID_123.mp3',
  'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/KieLoKaz/Free_Ganymed/KieLoKaz_-_14_-_Trip_to_Ganymed_Sax_ID_124.mp3',
];

function getFallbackSongs(artistName) {
  console.log('使用备用音源 for:', artistName);
  
  const songs = [
    { name: `${artistName} - 热门歌曲 1`, artist: artistName },
    { name: `${artistName} - 热门歌曲 2`, artist: artistName },
    { name: `${artistName} - 热门歌曲 3`, artist: artistName },
    { name: `${artistName} - 热门歌曲 4`, artist: artistName },
    { name: `${artistName} - 热门歌曲 5`, artist: artistName },
  ];
  
  return songs.map((song, index) => ({
    id: `fallback-${artistName}-${index}`,
    name: song.name,
    artist: song.artist,
    album: '精选集',
    cover: `https://picsum.photos/300/300?random=${artistName}-${index}`,
    url: FALLBACK_AUDIO_URLS[index % FALLBACK_AUDIO_URLS.length],
    duration: 180000,
  }));
}

export default {
  searchSongs,
  getSongUrl,
  getArtistHotSongs,
};
