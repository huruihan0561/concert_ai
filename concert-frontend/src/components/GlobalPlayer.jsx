import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, SkipBack, SkipForward, Music, ChevronUp, ChevronDown } from 'lucide-react';

const IDLE_TIMEOUT = 15000; // 15秒无操作自动展开

function GlobalPlayer({ playerState }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isIdle, setIsIdle] = useState(false);
  const idleTimerRef = useRef(null);
  const navigate = useNavigate();

  const resetIdleTimer = () => {
    setIsIdle(false);
    clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setIsIdle(true);
      setIsExpanded(true);
    }, IDLE_TIMEOUT);
  };

  useEffect(() => {
    if (!playerState.songTitle || !playerState.hasPlayed) return;
    resetIdleTimer();

    const events = ['mousemove', 'mousedown', 'touchstart', 'keydown', 'scroll'];
    events.forEach((evt) => window.addEventListener(evt, resetIdleTimer, { passive: true }));
    return () => {
      clearTimeout(idleTimerRef.current);
      events.forEach((evt) => window.removeEventListener(evt, resetIdleTimer));
    };
  }, [playerState.songTitle, playerState.hasPlayed]);

  const handleTogglePlay = () => {
    window.postMessage({ type: 'togglePlay' }, '*');
    resetIdleTimer();
  };

  const handleNext = () => {
    window.postMessage({ type: 'nextTrack' }, '*');
    resetIdleTimer();
  };

  const handlePrev = () => {
    window.postMessage({ type: 'prevTrack' }, '*');
    resetIdleTimer();
  };

  const handleGoToMusic = () => {
    clearTimeout(idleTimerRef.current);
    navigate('/music');
  };

  const handleExpandToggle = () => {
    setIsExpanded((prev) => !prev);
    resetIdleTimer();
  };

  if (!playerState.songTitle || !playerState.hasPlayed) return null;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 transition-all duration-300 ${
        isExpanded ? 'h-20' : 'h-16'
      }`}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/95 to-black/80 backdrop-blur-xl" />

      <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* 左侧：封面 + 歌曲信息 */}
        <div
          className="flex items-center space-x-4 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={handleGoToMusic}
        >
          <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-neon-blue/30 shadow-lg shadow-neon-blue/20">
            {playerState.cover ? (
              <img
                src={playerState.cover}
                alt={playerState.songArtist}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center">
                <Music className="w-6 h-6 text-white" />
              </div>
            )}
            {playerState.playing && (
              <div className="absolute inset-0 bg-neon-blue/20 animate-pulse" />
            )}
          </div>

          <div className="flex flex-col min-w-0">
            <span className="text-white font-medium truncate max-w-[180px]">
              {playerState.songTitle}
            </span>
            <span className="text-gray-400 text-sm truncate max-w-[180px]">
              {playerState.songArtist}
            </span>
          </div>
        </div>

        {/* 中间：播放控制 */}
        <div className="flex items-center space-x-1">
          <button
            onClick={handlePrev}
            className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          <button
            onClick={handleTogglePlay}
            className="p-3 rounded-full bg-gradient-to-r from-neon-blue to-neon-purple text-white shadow-lg shadow-neon-blue/30 hover:shadow-neon-purple/40 transition-all hover:scale-105"
          >
            {playerState.playing ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6" />
            )}
          </button>

          <button
            onClick={handleNext}
            className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* 右侧：时间 + 展开按钮 */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center space-x-3 text-gray-400 text-sm">
            <span>{playerState.currentTime}</span>
            <span>/</span>
            <span>{playerState.duration}</span>
          </div>

          {isIdle && (
            <button
              onClick={handleExpandToggle}
              className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all animate-pulse"
              title="点击收起"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          )}

          {!isIdle && isExpanded && (
            <button
              onClick={handleExpandToggle}
              className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              title="收起"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default GlobalPlayer;
