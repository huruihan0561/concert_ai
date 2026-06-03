import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// ─────────────────────────────────────────────
// 演唱会管家总控 (ConcertOrchestratorController)
// ─────────────────────────────────────────────
export const orchestratorApi = {
  // 1.1 新建会话
  newSession: () => api.post('/orchestrator/new-session'),

  // 1.2 统一聊天入口
  chat: (sessionId, userId, input) =>
    api.post('/orchestrator/chat', { sessionId, userId, input }),

  // 1.3 获取会话上下文
  getSession: (sessionId) =>
    api.get(`/orchestrator/session/${encodeURIComponent(sessionId)}`),

  // 1.4 更新会话上下文
  updateSession: (sessionId, updates) =>
    api.post(`/orchestrator/session/${encodeURIComponent(sessionId)}`, updates),

  // 1.5 清除会话
  deleteSession: (sessionId) =>
    api.delete(`/orchestrator/session/${encodeURIComponent(sessionId)}`),

  // 1.6 生成专属电台
  createRadio: (sessionId, mood = 'happy') =>
    api.post('/orchestrator/radio', { sessionId, mood }),

  // 1.7 生成纪念卡片
  generateSouvenir: (sessionId, userMessage) =>
    api.post('/orchestrator/souvenir', { sessionId, userMessage }),
};

// ─────────────────────────────────────────────
// 演唱会信息 (ConcertController)
// ─────────────────────────────────────────────
export const concertApi = {
  getConcerts: (params = {}) => api.get('/concerts', { params }),
  getConcertById: (id) => api.get(`/concerts/${id}`),
  getAllSingers: () => api.get('/concerts/singers'),
  getAllCities: () => api.get('/concerts/cities'),
};

// ─────────────────────────────────────────────
// AI 行程规划 (AiPlanningController)
// ─────────────────────────────────────────────
export const planningApi = {
  // 5.1 生成完整行程攻略
  generatePlan: (data) => api.post('/planning/generate', data),
  // 5.2 Agent 智能对话规划
  agentPlan: (userId, message) => api.post('/planning/agent', { userId, message }),
  // 5.3 获取场馆3D模型
  getVenue3D: (venueName) => api.get(`/planning/venue/3d/${encodeURIComponent(venueName)}`),
};

// ─────────────────────────────────────────────
// 歌手对话 (CelebrityAgentController)
// ─────────────────────────────────────────────
export const celebrityApi = {
  getList: () => api.get('/celebrity/list'),
  chat: (sessionId, singer, message) =>
    api.post('/celebrity/chat', { sessionId, singer, message }),
  clearSession: (sessionId) =>
    api.post('/celebrity/clear', null, { params: { sessionId } }),
  getHistory: (sessionId) =>
    api.get('/celebrity/history', { params: { sessionId } }),
};

// ─────────────────────────────────────────────
// 音乐推荐 (MusicAgentController)
// ─────────────────────────────────────────────
export const musicAgentApi = {
  getMoods: () => api.get('/music/moods'),
  recommend: (mood, input) => api.post('/music/recommend', { mood, input }),
  getPlaylist: (singer) => api.get(`/music/playlist/${encodeURIComponent(singer)}`),
};

// ─────────────────────────────────────────────
// 交通查询 (TransportController)
// ─────────────────────────────────────────────
export const transportApi = {
  searchDeparture: (data) => api.post('/transport/search/departure', data),
  searchReturn: (data) => api.post('/transport/search/return', data),
  searchRoundTrip: (data) => api.post('/transport/search/roundtrip', data),
};

// ─────────────────────────────────────────────
// 兼容层（保留旧方法，映射到新接口）
// ─────────────────────────────────────────────
export const musicApi = {
  getPlaylist: (singer) => musicAgentApi.getPlaylist(singer),
  getArtistSongs: async (artistName) => {
    try {
      const res = await musicAgentApi.getPlaylist(artistName);
      if (res.success && res.data?.songs) {
        return res.data.songs.map((s, i) => ({
          id: `song-${artistName}-${i}`,
          name: s.name || s.songName || '未知歌曲',
          artist: s.artist || artistName,
          cover: s.cover || `https://picsum.photos/300/300?random=${encodeURIComponent(artistName + (s.name || i))}`,
          url: s.url,
          duration: 180000,
        })).filter(s => s.url);
      }
      return getFallbackSongs(artistName);
    } catch {
      return getFallbackSongs(artistName);
    }
  },
};

const FALLBACK_AUDIO_URLS = [
  'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/Tours/Enthusiast/Tours_-_01_-_Enthusiast.mp3',
  'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/Chad_Crouch/Arps/Chad_Crouch_-_Elisions.mp3',
  'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/KieLoKaz/Free_Ganymed/KieLoKaz_-_01_-_Reunion_of_the_Spirits_ID_111.mp3',
  'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/KieLoKaz/Free_Ganymed/KieLoKaz_-_02_-_Trip_to_Ganymed_ID_112.mp3',
  'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/KieLoKaz/Free_Ganymed/KieLoKaz_-_03_-_Sehnsucht_ID_113.mp3',
];

function getFallbackSongs(artistName) {
  const defaultSongs = {
    '周杰伦': ['晴天', '七里香', '告白气球', '夜曲', '稻香'],
    '林俊杰': ['曹操', '不为谁而作的歌', '可惜没如果', '修炼爱情', '一千年以后'],
    '陈奕迅': ['十年', '富士山下', '爱情转移', 'K歌之王', '浮夸'],
    '邓紫棋': ['光年之外', '泡沫', '倒数', '喜欢你', '多远都要在一起'],
    '五月天': ['突然好想你', '倔强', '恋爱ing', '温柔', '知足'],
    '薛之谦': ['演员', '丑八怪', '绅士', '刚刚好', '意外'],
  };
  const names = defaultSongs[artistName] || ['歌曲1', '歌曲2', '歌曲3', '歌曲4', '歌曲5'];
  return names.map((name, i) => ({
    id: `fallback-${artistName}-${i}`,
    name,
    artist: artistName,
    cover: `https://picsum.photos/300/300?random=${encodeURIComponent(artistName)}-${i}`,
    url: FALLBACK_AUDIO_URLS[i % FALLBACK_AUDIO_URLS.length],
    duration: 180000,
  }));
}

export default api;
