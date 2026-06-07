import axios from 'axios';
import { getStoredUserId } from './helpers';

const API_BASE_URL = '/concert/api';

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

const normalizeResult = (result) => {
  if (result && typeof result === 'object' && 'success' in result) {
    return result;
  }

  return {
    success: true,
    code: 200,
    message: 'success',
    data: result,
  };
};

const wrap = async (request) => normalizeResult(await request);

export const concertApi = {
  getConcerts: (params = {}) => wrap(api.get('/concerts', { params })),
  getConcertById: (id) => wrap(api.get(`/concerts/${id}`)),
  getAllSingers: () => wrap(api.get('/concerts/singers')),
  getAllCities: () => wrap(api.get('/concerts/cities')),
};

export const agentApi = {
  // 通用助手模式（AI助手页面）- 不传递身份
  chat: ({ sessionId, message, concertId, identity, hasIdentity, singer }) =>
    wrap(api.post('/agent/chat', { sessionId, userId: getStoredUserId(), message, concertId, identity, hasIdentity, singer })),
  // 流式聊天 - 支持两种模式
  // 演唱会专属模式：hasIdentity=true, singer=歌手名, identity=粉丝身份
  // 通用助手模式：hasIdentity=false/null, 不传递 singer 和 identity
  chatStream: ({ sessionId, message, concertId, identity, hasIdentity, singer, signal }) => {
    return fetch('/concert/api/agent/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sessionId || '',
        userId: getStoredUserId(),
        message,
        concertId,
        identity,
        hasIdentity,
        singer
      }),
      signal,
    });
  },
  getHistory: (sessionId) => wrap(api.get(`/agent/history/${sessionId}`)),
  clearSession: (sessionId) => wrap(api.delete(`/agent/clear/${sessionId}`)),
};

export const musicApi = {
  getPlaylist: (singer) => wrap(api.get(`/music/playlist/${encodeURIComponent(singer)}`)),
  getArtistSongs: async (artistName) => {
    try {
      const res = await wrap(api.get(`/music/playlist/${encodeURIComponent(artistName)}`));
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        return res.data.map((song, index) => ({
          id: `song-${artistName}-${index}`,
          name: song.name || `歌曲${index + 1}`,
          artist: song.artist || artistName,
          cover: `https://picsum.photos/seed/${encodeURIComponent(`${artistName}-${song.name || index}`)}/300/300`,
          url: song.url || '',
          duration: 180000,
          searchUrl: buildSongSearchUrl(song.name || `歌曲${index + 1}`, song.artist || artistName),
        }));
      }
      return [];
    } catch {
      return [];
    }
  },
};

export const seatMapApi = {
  getSeatMap: (concertId) => wrap(api.get(`/seatmap/${concertId}`)),
};

export const userApi = {
  follow: (userId, concertId) => wrap(api.post('/user/follow', { userId, concertId })),
  unfollow: (followId) => wrap(api.delete(`/user/follow/${followId}`)),
  getFollows: (userId) => wrap(api.get('/user/follows', { params: { userId } })),
  checkFollow: (userId, concertId) =>
    wrap(api.get('/user/follow/check', { params: { userId, concertId } })),
};

export const reminderApi = {
  // 获取用户提醒列表
  getList: (userId, limit = 50) => wrap(api.get('/reminders/list', { params: { userId, limit } })),
  // 获取未读提醒数量
  getUnreadCount: (userId) => wrap(api.get('/reminders/unread-count', { params: { userId } })),
  // 获取演唱会相关提醒
  getConcertReminders: (userId, concertId) => wrap(api.get(`/reminders/concert/${concertId}`, { params: { userId } })),
  // 创建提醒
  create: (reminder) => wrap(api.post('/reminders/create', reminder)),
  // 标记提醒已读
  markAsRead: (id) => wrap(api.put(`/reminders/${id}/read`)),
  // 标记所有提醒已读
  markAllAsRead: (userId) => wrap(api.put('/reminders/read-all', null, { params: { userId } })),
  // 删除提醒
  delete: (id) => wrap(api.delete(`/reminders/${id}`)),
  // 删除演唱会相关提醒
  deleteConcertReminders: (userId, concertId) => wrap(api.delete(`/reminders/concert/${concertId}`, { params: { userId } })),
  // 获取待发送提醒（旧接口，保留兼容）
  getDue: (userId) => wrap(api.get('/reminders/due', { params: { userId } })),
  clear: (userId) => wrap(api.post('/reminders/clear', null, { params: { userId } })),
};

function buildSongSearchUrl(name, artist) {
  const keyword = encodeURIComponent(`${name} ${artist}`);
  return `https://y.music.163.com/m/search?keyword=${keyword}`;
}

export default api;
