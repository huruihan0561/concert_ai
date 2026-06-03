/**
 * 网易云音乐 API 封装
 * 使用第三方部署的网易云音乐 API 获取歌曲播放链接
 */

// 使用多个可用的网易云音乐 API 源（备用）
const API_SOURCES = [
  'https://netease-cloud-music-api-psi-rosy.vercel.app',
  'https://netease-cloud-music-api-gamma.vercel.app',
  'https://netease-cloud-music-api-fawn.vercel.app',
];

let currentApiIndex = 0;

function getApiBase() {
  return API_SOURCES[currentApiIndex];
}

function switchApiSource() {
  currentApiIndex = (currentApiIndex + 1) % API_SOURCES.length;
  console.log('切换到 API 源:', getApiBase());
}

/**
 * 发送请求（带自动重试和切换 API 源）
 */
async function fetchWithRetry(url, options = {}, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Accept': 'application/json',
          ...options.headers,
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.warn(`API 请求失败 (尝试 ${i + 1}/${retries + 1}):`, error);
      
      if (i < retries) {
        switchApiSource();
        // 替换 URL 中的域名
        const newUrl = url.replace(API_SOURCES[(currentApiIndex - 1 + API_SOURCES.length) % API_SOURCES.length], getApiBase());
        url = newUrl;
      } else {
        throw error;
      }
    }
  }
}

/**
 * 搜索歌曲
 * @param {string} keywords - 搜索关键词
 * @param {number} limit - 返回数量限制
 * @returns {Promise<Array>} - 歌曲列表
 */
export const searchSongs = async (keywords, limit = 5) => {
  try {
    const data = await fetchWithRetry(
      `${getApiBase()}/search?keywords=${encodeURIComponent(keywords)}&limit=${limit}&type=1`
    );
    
    if (data.code === 200 && data.result && data.result.songs) {
      return data.result.songs.map(song => ({
        id: song.id,
        name: song.name,
        artist: song.artists.map(a => a.name).join('/'),
        album: song.album.name,
        duration: song.duration,
        cover: song.album.picUrl || `https://picsum.photos/300/300?random=${song.id}`,
      }));
    }
    return [];
  } catch (error) {
    console.error('Search songs error:', error);
    return [];
  }
};

/**
 * 获取歌曲播放链接
 * @param {number} songId - 歌曲 ID
 * @returns {Promise<string>} - 播放链接
 */
export const getSongUrl = async (songId) => {
  try {
    const data = await fetchWithRetry(
      `${getApiBase()}/song/url?id=${songId}&br=320000`
    );
    
    if (data.code === 200 && data.data && data.data[0]) {
      const songData = data.data[0];
      // 检查 URL 是否有效
      if (songData.url && songData.url !== null && songData.url !== '') {
        return songData.url;
      }
    }
    return null;
  } catch (error) {
    console.error('Get song URL error:', error);
    return null;
  }
};

/**
 * 获取歌手热门歌曲（包含播放链接）
 * @param {string} artistName - 歌手名称
 * @param {number} limit - 返回数量
 * @returns {Promise<Array>} - 歌曲列表（包含播放链接）
 */
export const getArtistHotSongs = async (artistName, limit = 5) => {
  try {
    console.log('正在搜索歌手:', artistName);
    
    // 1. 先搜索歌手获取歌手 ID
    const searchData = await fetchWithRetry(
      `${getApiBase()}/search?keywords=${encodeURIComponent(artistName)}&type=100&limit=1`
    );
    
    if (searchData.code !== 200 || !searchData.result || !searchData.result.artists || searchData.result.artists.length === 0) {
      console.log('未找到歌手:', artistName);
      return getFallbackSongs(artistName);
    }
    
    const artistId = searchData.result.artists[0].id;
    console.log('找到歌手 ID:', artistId);
    
    // 2. 获取歌手热门歌曲
    const songsData = await fetchWithRetry(
      `${getApiBase()}/artist/top/song?id=${artistId}&limit=${limit * 2}`
    );
    
    if (songsData.code !== 200 || !songsData.songs || songsData.songs.length === 0) {
      console.log('未找到歌手歌曲');
      return getFallbackSongs(artistName);
    }
    
    // 3. 获取歌曲播放链接
    const songs = songsData.songs.slice(0, limit * 2);
    const songIds = songs.map(s => s.id).join(',');
    
    console.log('正在获取播放链接，歌曲数量:', songs.length);
    
    const urlData = await fetchWithRetry(
      `${getApiBase()}/song/url?id=${songIds}&br=320000`
    );
    
    const urlMap = {};
    if (urlData.code === 200 && urlData.data) {
      urlData.data.forEach(item => {
        if (item.url && item.url !== null && item.url !== '') {
          urlMap[item.id] = item.url;
        }
      });
    }
    
    console.log('获取到播放链接数量:', Object.keys(urlMap).length);
    
    // 4. 组装结果，只返回有播放链接的歌曲
    const result = [];
    for (const song of songs) {
      if (urlMap[song.id]) {
        result.push({
          id: String(song.id),
          name: song.name,
          artist: song.ar.map(a => a.name).join('/'),
          album: song.al.name,
          cover: song.al.picUrl || `https://picsum.photos/300/300?random=${song.id}`,
          url: urlMap[song.id],
          duration: song.dt,
        });
        
        if (result.length >= limit) {
          break;
        }
      }
    }
    
    if (result.length === 0) {
      console.log('没有可用的播放链接，使用备用音源');
      return getFallbackSongs(artistName);
    }
    
    console.log('成功获取歌曲:', result.map(s => s.name));
    return result;
  } catch (error) {
    console.error('Get artist hot songs error:', error);
    return getFallbackSongs(artistName);
  }
};

/**
 * 备用歌曲列表（当 API 失败时使用）
 * 使用不同的免费音乐源，确保每首歌声音不同
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
  
  // 根据歌手名称生成固定的歌曲列表，确保同一歌手每次返回相同的歌曲
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
