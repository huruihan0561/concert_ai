import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Play, Pause, Sparkles, Send, Radio } from 'lucide-react';
import { musicAgentApi } from '../../utils/api';

const MusicRadioTab = ({ onSelectSinger }) => {
  const [moods, setMoods] = useState([]);
  const [selectedMood, setSelectedMood] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMoods, setLoadingMoods] = useState(true);
  const [input, setInput] = useState('');
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    fetchMoods();
    return () => { audioRef.current?.pause(); };
  }, []);

  const fetchMoods = async () => {
    try {
      const res = await musicAgentApi.getMoods();
      if (res.success && res.data) setMoods(res.data);
    } catch (e) { console.error('Failed to fetch moods:', e); }
    finally { setLoadingMoods(false); }
  };

  const handleMoodSelect = async (mood) => {
    setSelectedMood(mood);
    setLoading(true);
    try {
      const res = await musicAgentApi.recommend(mood.key, input);
      if (res.success && res.data) {
        setRecommendation(res.data);
        if (res.data.songs?.length > 0) {
          const first = res.data.songs[0];
          setCurrentSong({ name: first.name, artist: first.artist, url: first.url, cover: first.cover });
          if (onSelectSinger && res.data.type === 'singer' && res.data.singer) {
            onSelectSinger(res.data.singer);
          }
        }
      }
    } catch (e) { console.error('Recommendation failed:', e); }
    finally { setLoading(false); }
  };

  const handleInputSubmit = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const res = await musicAgentApi.recommend(null, input);
      if (res.success && res.data) {
        setRecommendation(res.data);
        const mood = moods.find(m => m.key === res.data.mood);
        if (mood) setSelectedMood(mood);
        if (res.data.songs?.length > 0) {
          const first = res.data.songs[0];
          setCurrentSong({ name: first.name, artist: first.artist, url: first.url, cover: first.cover });
          if (onSelectSinger && res.data.type === 'singer' && res.data.singer) {
            onSelectSinger(res.data.singer);
          }
        }
      }
    } catch (e) { console.error('Recommendation failed:', e); }
    finally { setLoading(false); }
  };

  const togglePlay = (song) => {
    if (!audioRef.current) audioRef.current = new Audio();
    const audio = audioRef.current;
    if (currentSong?.name === song.name && isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.src = song.url;
      audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      audio.onended = () => setIsPlaying(false);
      setCurrentSong({ ...song, url: song.url });
    }
  };

  if (loadingMoods) {
    return (
      <div className="glass rounded-2xl p-8 border border-white/10 flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-neon-orange border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">加载情绪类型...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl border border-white/10 overflow-hidden">
      {/* 隐藏的音频播放器 */}
      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} className="hidden" />

      <div className="grid grid-cols-1 md:grid-cols-3 h-[600px]">
        {/* 左侧情绪选择 */}
        <div className="border-r border-white/10 p-4 overflow-y-auto">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-neon-orange" />
            选择情绪
          </h3>

          {/* 自定义输入 */}
          <div className="mb-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="描述你的心情..."
                className="flex-1 px-3 py-2 glass rounded-lg border border-white/10 focus:border-neon-orange/50 focus:outline-none text-white text-sm bg-transparent"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleInputSubmit}
                disabled={loading || !input.trim()}
                className="px-3 py-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg text-white disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </motion.button>
            </div>
          </div>

          <div className="space-y-2">
            {moods.map((mood) => (
              <motion.button
                key={mood.key}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleMoodSelect(mood)}
                disabled={loading}
                className={`w-full p-3 rounded-xl border text-left transition-all ${
                  selectedMood?.key === mood.key
                    ? 'bg-neon-orange/10 border-neon-orange'
                    : 'glass border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{mood.icon}</span>
                  <div>
                    <p className="font-medium text-white">{mood.name}</p>
                    <p className="text-xs text-gray-400">{mood.description}</p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* 右侧歌曲列表 */}
        <div className="md:col-span-2 flex flex-col">
          <div className="p-4 border-b border-white/10">
            <h3 className="font-bold text-white flex items-center">
              <Music className="w-5 h-5 mr-2 text-neon-orange" />
              {recommendation?.message || '选择情绪或描述心情，获取推荐歌曲'}
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-neon-orange border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-400">AI 正在为你推荐歌曲...</p>
                </div>
              </div>
            ) : recommendation?.songs ? (
              <div className="space-y-3">
                <AnimatePresence>
                  {recommendation.songs.map((song, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        currentSong?.name === song.name
                          ? 'bg-neon-orange/10 border-neon-orange'
                          : 'glass border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-orange-500/20 to-red-500/20 flex-shrink-0">
                          {song.cover ? (
                            <img src={song.cover} alt={song.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Music className="w-6 h-6 text-white/30" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">{song.name}</p>
                          <p className="text-sm text-gray-400">{song.artist}</p>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => togglePlay({ name: song.name, artist: song.artist, url: song.url })}
                          className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0"
                        >
                          {currentSong?.name === song.name && isPlaying ? (
                            <Pause className="w-5 h-5 text-white" />
                          ) : (
                            <Play className="w-5 h-5 text-white ml-0.5" />
                          )}
                        </motion.button>
                      </div>

                      {/* 内嵌播放器（仅当前播放歌曲） */}
                      {currentSong?.name === song.name && song.url && (
                        <audio
                          src={song.url}
                          controls
                          className="w-full mt-2"
                        />
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <Music className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>选择左侧情绪，开始你的音乐之旅</p>
                  <p className="text-sm mt-2 text-gray-600">或输入你的心情描述</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicRadioTab;
