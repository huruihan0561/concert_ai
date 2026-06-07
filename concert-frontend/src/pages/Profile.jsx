import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Star, ChevronRight, Loader2, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { userApi } from '../utils/api';
import { useApp } from '../context/AppContext';
import { formatDate, getConcertStatus, getStatusColor, getStatusText } from '../utils/helpers';

const Profile = ({ onSelectSinger }) => {
  const { userId } = useApp();
  const navigate = useNavigate();
  const [follows, setFollows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    loadFollows();
  }, [userId]);

  const loadFollows = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await userApi.getFollows(userId);
      if (res.success && Array.isArray(res.data)) {
        setFollows(res.data);
      } else {
        setFollows([]);
      }
    } catch (e) {
      console.error('加载关注列表失败:', e);
      setFollows([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async (followId) => {
    setRemovingId(followId);
    try {
      await userApi.unfollow(followId);
      setFollows((prev) => prev.filter((f) => f.id !== followId));
    } catch (e) {
      console.error('取消关注失败:', e);
    } finally {
      setRemovingId(null);
    }
  };

  const handleConcertClick = (concert) => {
    navigate(`/concerts/${concert.id || concert.concertId}`);
  };

  const extractConcert = (item) => ({
    id: item.concertId || item.id,
    singer: item.singer || (item.concert || {}).singer || '未知歌手',
    city: item.city || (item.concert || {}).city || '',
    venue: item.venue || (item.concert || {}).venue || '',
    venueAddress: item.venueAddress || (item.concert || {}).venueAddress || '',
    showTime: item.showTime || (item.concert || {}).showTime || '',
    imageUrl: item.imageUrl || (item.concert || {}).imageUrl || '',
    status: item.status || (item.concert || {}).status || '',
  });

  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="max-w-2xl mx-auto px-4">

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-white mb-1">我的关注</h1>
          <p className="text-gray-500 text-sm">
            用户 ID：{userId} · 共 {follows.length} 场关注
          </p>
        </motion.div>

        {/* User card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl p-5 mb-5"
          style={{
            background: 'linear-gradient(135deg,rgba(34,211,238,0.08),rgba(168,85,247,0.08))',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
              style={{ background: 'linear-gradient(135deg,#22d3ee,#a855f7)', color: 'white' }}>
              {userId?.toString().slice(-2) || '??'}
            </div>
            <div>
              <p className="text-white font-semibold">演唱会忠实爱好者</p>
              <p className="text-gray-400 text-xs">ID: {userId}</p>
            </div>
          </div>
          <div className="mt-4 flex gap-6">
            <div className="text-center">
              <p className="text-xl font-bold text-white">{follows.length}</p>
              <p className="text-gray-500 text-xs">关注场次</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-cyan-400">
                {follows.filter((f) => {
                  const concert = extractConcert(f);
                  return !getConcertStatus(concert.showTime)?.includes('结束');
                }).length}
              </p>
              <p className="text-gray-500 text-xs">即将开演</p>
            </div>
          </div>
        </motion.div>

        {/* Upcoming concerts countdown */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl p-4 mb-6"
          style={{
            background: 'linear-gradient(135deg,rgba(249,115,22,0.1),rgba(251,191,36,0.1))',
            border: '1px solid rgba(249,115,22,0.2)',
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-orange-400" />
              <span className="text-white font-semibold text-sm">即将开始</span>
            </div>
            <span className="text-xs text-orange-400">开演提醒已开启</span>
          </div>
          {(() => {
            const upcomingConcerts = follows
              .map(f => extractConcert(f))
              .filter(c => !getConcertStatus(c.showTime)?.includes('结束'))
              .sort((a, b) => new Date(a.showTime) - new Date(b.showTime));
            
            if (upcomingConcerts.length === 0) {
              return (
                <p className="text-gray-500 text-sm text-center py-2">暂无即将开始的演唱会</p>
              );
            }
            
            const nextConcert = upcomingConcerts[0];
            const now = new Date();
            const showTime = new Date(nextConcert.showTime);
            const diff = showTime - now;
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            
            return (
              <div className="flex items-center gap-3">
                <img
                  src={nextConcert.imageUrl || 'https://picsum.photos/200/200?random=concert'}
                  alt={nextConcert.singer}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm">{nextConcert.singer}</p>
                  <p className="text-gray-500 text-xs">{nextConcert.city}</p>
                </div>
                <div className="text-right">
                  <div className="flex gap-1">
                    {days > 0 && (
                      <span className="px-2 py-1 rounded bg-white/10 text-white text-xs font-bold">
                        {days}天
                      </span>
                    )}
                    <span className="px-2 py-1 rounded bg-white/10 text-white text-xs font-bold">
                      {hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}
                    </span>
                  </div>
                  <p className="text-gray-500 text-xs mt-1">开演倒计时</p>
                </div>
              </div>
            );
          })()}
        </motion.div>

        {/* Follow list */}
        <div>
          <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-cyan-400" />
            关注的演唱会
          </h3>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-7 h-7 animate-spin text-cyan-400" />
            </div>
          ) : follows.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <Star className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 text-sm mb-4">还没有关注任何演唱会</p>
              <Link
                to="/concerts"
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#22d3ee,#a855f7)' }}
              >
                去发现演唱会
                <ChevronRight className="w-4 h-4" />
              </Link>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {follows.map((item, index) => {
                const concert = extractConcert(item);
                const status = getConcertStatus(concert.showTime);
                return (
                  <motion.div
                    key={item.id || item.concertId || index}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="rounded-xl p-4 flex items-center gap-3 cursor-pointer transition-all hover:bg-white/5"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                    onClick={() => handleConcertClick(concert)}
                  >
                    <img
                      src={concert.imageUrl || 'https://picsum.photos/200/200?random=concert'}
                      alt={concert.singer}
                      className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{concert.singer}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{concert.city} · {concert.venue}</p>
                      <p className="text-gray-500 text-xs">{formatDate(concert.showTime, 'MM月dd日 HH:mm')}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs border ${getStatusColor(status)}`}>
                        {getStatusText(status)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const fid = item.id || item.concertId;
                          if (fid) handleUnfollow(fid);
                        }}
                        disabled={removingId === (item.id || item.concertId)}
                        className="text-gray-600 hover:text-red-400 transition-colors"
                      >
                        {removingId === (item.id || item.concertId) ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
