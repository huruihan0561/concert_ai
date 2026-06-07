import { useState, useRef, useEffect, useCallback } from 'react';
import { ALBUMS_DATA } from '../hooks/albumData';
import AlbumCoverflow from '../components/AlbumCoverflow';

function MusicPage() {
  const [view, setView] = useState('albums'); // 'albums' or 'player'
  const [currentAlbumIndex, setCurrentAlbumIndex] = useState(0);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioError, setAudioError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef(null);

  const currentAlbum = ALBUMS_DATA[currentAlbumIndex];
  const currentTrack = currentAlbum?.tracks[currentTrackIndex];

  // 获取完整的音频 URL
  const getAudioUrl = (filePath) => {
    if (!filePath) return null;
    // 如果已经是完整 URL，直接返回
    if (filePath.startsWith('http')) return filePath;
    // 如果是相对路径，添加 /concert/ 前缀
    if (filePath.startsWith('/')) {
      return `/concert${filePath}`;
    }
    // 其他情况
    return `/concert/${filePath}`;
  };

  // 加载音频
  useEffect(() => {
    if (audioRef.current && currentTrack) {
      const audioUrl = getAudioUrl(currentTrack.file);
      console.log('Loading audio:', audioUrl);
      
      if (audioUrl) {
        setIsLoading(true);
        setAudioError(false);
        audioRef.current.src = audioUrl;
        audioRef.current.load();
        setDuration(0);
        setCurrentTime(0);
      } else {
        setAudioError(true);
        console.error('Invalid audio file path:', currentTrack.file);
      }
    }
  }, [currentTrack]);

  // 处理音频加载成功
  const handleCanPlay = useCallback(() => {
    setIsLoading(false);
    setAudioError(false);
    console.log('Audio loaded successfully');
  }, []);

  // 处理音频加载错误
  const handleAudioError = useCallback((e) => {
    console.error('Audio load error:', e);
    console.error('Audio src:', audioRef.current?.src);
    setAudioError(true);
    setIsLoading(false);
    setIsPlaying(false);
  }, []);

  // 音频事件监听
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => handleNext();

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleAudioError);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('stalled', () => console.log('Audio loading stalled'));
    audio.addEventListener('waiting', () => console.log('Audio waiting'));

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleAudioError);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('stalled', () => {});
      audio.removeEventListener('waiting', () => {});
    };
  }, [handleAudioError, handleCanPlay]);

  const togglePlay = () => {
    if (audioError) {
      console.warn('Cannot play: audio error');
      return;
    }
    if (isLoading) {
      console.warn('Audio still loading');
      return;
    }
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch(err => {
            console.error('Play failed:', err);
            setAudioError(true);
          });
      }
    }
  };

  const handleNext = useCallback(() => {
    if (currentTrackIndex < currentAlbum?.tracks?.length - 1) {
      setCurrentTrackIndex(prev => prev + 1);
    } else if (currentAlbumIndex < ALBUMS_DATA.length - 1) {
      setCurrentAlbumIndex(prev => prev + 1);
      setCurrentTrackIndex(0);
    } else {
      setCurrentAlbumIndex(0);
      setCurrentTrackIndex(0);
    }
  }, [currentTrackIndex, currentAlbumIndex, currentAlbum]);

  const handlePrev = useCallback(() => {
    if (currentTrackIndex > 0) {
      setCurrentTrackIndex(prev => prev - 1);
    } else if (currentAlbumIndex > 0) {
      setCurrentAlbumIndex(prev => prev - 1);
      const prevAlbum = ALBUMS_DATA[currentAlbumIndex - 1];
      setCurrentTrackIndex(prevAlbum?.tracks?.length - 1 || 0);
    } else {
      const lastAlbum = ALBUMS_DATA[ALBUMS_DATA.length - 1];
      setCurrentAlbumIndex(ALBUMS_DATA.length - 1);
      setCurrentTrackIndex(lastAlbum?.tracks?.length - 1 || 0);
    }
  }, [currentTrackIndex, currentAlbumIndex]);

  const handleSeek = (e) => {
    if (audioRef.current) {
      const newTime = parseFloat(e.target.value);
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleCoverflowSelect = useCallback((index) => {
    if (index === currentAlbumIndex) {
      setCurrentTrackIndex(0);
      setView('player');
    } else {
      setCurrentAlbumIndex(index);
    }
  }, [currentAlbumIndex]);

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-40 bg-[#0a0a0f] overflow-hidden" style={{ top: '64px' }}>
      <audio 
        ref={audioRef} 
        onError={handleAudioError}
        onCanPlay={handleCanPlay}
        preload="metadata"
        crossOrigin="anonymous"
      />

      {/* 错误提示 */}
      {audioError && (
        <div className="fixed bottom-4 right-4 bg-red-500/90 text-white px-4 py-2 rounded-lg text-sm z-50 shadow-lg">
          ⚠️ 音频加载失败，请检查文件路径
        </div>
      )}

      {/* 加载提示 */}
      {isLoading && !audioError && (
        <div className="fixed bottom-4 right-4 bg-purple-500/90 text-white px-4 py-2 rounded-lg text-sm z-50 shadow-lg">
          🎵 加载音频中...
        </div>
      )}

      {/* ════════════ Albums View — Coverflow ════════════ */}
      {view === 'albums' && (
        <div className="h-full overflow-y-auto">
          {/* 顶部动态背景（当前专辑封面模糊） */}
          <div
            className="absolute inset-0 opacity-30 pointer-events-none transition-all duration-700"
            style={{
              backgroundImage: `url(${ALBUMS_DATA[currentAlbumIndex]?.cover})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(60px) saturate(1.5)',
            }}
          />
          {/* 顶部暗化遮罩 */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f]/60 via-transparent to-[#0a0a0f]/80 pointer-events-none" />

          <div className="relative z-10 flex flex-col h-full">
            {/* 标题栏 */}
            <div className="flex items-center justify-between px-8 pt-8 pb-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/40">
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-6 h-6">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-wide">我的音乐库</h1>
                  <p className="text-gray-400 text-sm">{ALBUMS_DATA.length} 张专辑 · 点击选中，再次点击进入播放</p>
                </div>
              </div>

              {/* 当前已选中专辑的快速播放按钮 */}
              <button
                onClick={() => { setCurrentTrackIndex(0); setView('player'); }}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm font-medium shadow-lg shadow-purple-500/30 transition-all hover:scale-105"
              >
                <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span>立即播放</span>
              </button>
            </div>

            {/* 3D Coverflow 主区域 */}
            <div className="flex-1 flex flex-col items-center justify-center">
              <AlbumCoverflow
                albums={ALBUMS_DATA}
                activeIndex={currentAlbumIndex}
                onSelect={handleCoverflowSelect}
              />

              {/* 当前专辑曲目预览列表 */}
              <div className="mt-2 w-full max-w-sm px-4">
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                    <span className="text-gray-300 text-sm font-medium">
                      {ALBUMS_DATA[currentAlbumIndex]?.title} — 曲目
                    </span>
                    <span className="text-gray-500 text-xs">
                      {ALBUMS_DATA[currentAlbumIndex]?.tracks.length} 首
                    </span>
                  </div>
                  <div className="max-h-36 overflow-y-auto py-1">
                    {ALBUMS_DATA[currentAlbumIndex]?.tracks.map((track, idx) => (
                      <button
                        key={idx}
                        onClick={() => { setCurrentTrackIndex(idx); setView('player'); }}
                        className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-white/10 transition-colors text-left group"
                      >
                        <span className="text-gray-500 text-xs w-5 shrink-0">{idx + 1}</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                          className="w-3.5 h-3.5 text-purple-400 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                        <span className="text-gray-300 text-sm truncate group-hover:text-white transition-colors">
                          {track.title}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════ Player View ════════════ */}
      {view === 'player' && currentAlbum && (
        <div className="h-full flex flex-col bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
          {/* Background image */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `url(${currentAlbum.cover})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(40px)',
            }}
          />

          <div className="relative z-10 flex flex-col h-full">
            {/* Top bar */}
            <div className="flex items-center justify-between p-6">
              <button
                onClick={() => setView('albums')}
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                <span>返回专辑</span>
              </button>
              <div className="text-gray-400">
                {currentAlbumIndex + 1} / {ALBUMS_DATA.length}
              </div>
            </div>

            {/* Album cover */}
            <div className="flex-1 flex items-center justify-center px-8">
              <div className="relative">
                <div
                  className="w-72 h-72 md:w-96 md:h-96 rounded-xl overflow-hidden shadow-2xl"
                  style={{
                    boxShadow: isPlaying && !audioError
                      ? '0 0 60px rgba(139,92,246,0.5), 0 30px 60px rgba(0,0,0,0.8)'
                      : '0 30px 60px rgba(0,0,0,0.8)',
                    transition: 'box-shadow 0.5s ease',
                    animation: isPlaying && !audioError ? 'albumSpin 20s linear infinite' : 'none',
                  }}
                >
                  <img 
                    src={currentAlbum.cover} 
                    alt={currentAlbum.title} 
                    className="w-full h-full object-cover"
                    onError={(e) => console.error('Cover image load error:', currentAlbum.cover)}
                  />
                </div>
                <div
                  className="absolute inset-0 rounded-xl opacity-30 pointer-events-none"
                  style={{ background: 'radial-gradient(circle at 30% 30%, transparent 30%, rgba(0,0,0,0.5) 100%)' }}
                />
              </div>
            </div>

            {/* Player controls */}
            <div className="p-6 pb-12">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-white">{currentTrack?.title || '未知曲目'}</h2>
                <p className="text-gray-400">{currentAlbum.artist}</p>
              </div>

              <div className="mb-6">
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  disabled={audioError}
                  className="w-full h-1 bg-gray-700 rounded-full appearance-none cursor-pointer disabled:opacity-50"
                />
                <div className="flex justify-between text-sm text-gray-400 mt-2">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              <div className="flex items-center justify-center space-x-6">
                <button
                  onClick={handlePrev}
                  className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  disabled={audioError}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-6 h-6">
                    <path d="M6 9H4.5a2.5 2.5 0 0 0 0 5H6M13 6v12M17 6v12M6 6v12" />
                  </svg>
                </button>

                <button
                  onClick={togglePlay}
                  disabled={audioError || isLoading}
                  className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 flex items-center justify-center transition-all shadow-lg hover:shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : isPlaying ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-8 h-8">
                      <rect x="6" y="4" width="4" height="16" />
                      <rect x="14" y="4" width="4" height="16" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-8 h-8">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>

                <button
                  onClick={handleNext}
                  className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  disabled={audioError}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-6 h-6">
                    <path d="M18 9h1.5a2.5 2.5 0 0 1 0 5H18M11 6v12M7 6v12M18 6v12" />
                  </svg>
                </button>
              </div>

              {currentAlbum.tracks.length > 1 && (
                <div className="mt-8 max-h-48 overflow-y-auto">
                  <h3 className="text-gray-400 text-sm mb-3 px-2">曲目列表</h3>
                  {currentAlbum.tracks.map((track, index) => (
                    <div
                      key={index}
                      onClick={() => setCurrentTrackIndex(index)}
                      className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${
                        index === currentTrackIndex ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5'
                      }`}
                    >
                      <span className="w-6 text-sm">{index + 1}</span>
                      <span className="flex-1 truncate">{track.title}</span>
                      {index === currentTrackIndex && isPlaying && !audioError && (
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 播放中旋转动画 */}
      <style>{`
        @keyframes albumSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default MusicPage;