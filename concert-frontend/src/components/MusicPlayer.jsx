import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Music } from 'lucide-react';

export default function MusicPlayer({ songs = [], visible = true }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const audioRef = useRef(null);

  const currentSong = songs[currentIndex];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      setCurrentTime(audio.currentTime);
      setProgress((audio.currentTime / audio.duration) * 100 || 0);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      handleNext();
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentIndex]);

  useEffect(() => {
    if (audioRef.current && currentSong?.url) {
      audioRef.current.src = currentSong.url;
      if (isPlaying) {
        audioRef.current.play().catch(e => console.log('播放失败:', e));
      }
    }
  }, [currentIndex, currentSong]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(e => {
          console.error('播放失败:', e);
          if (songs.length > 1) handleNext();
        });
    }
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % songs.length);
    setIsPlaying(true);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + songs.length) % songs.length);
    setIsPlaying(true);
  };

  const handleSeek = (e) => {
    const time = (e.target.value / 100) * duration;
    audioRef.current.currentTime = time;
    setProgress(e.target.value);
  };

  const handleVolumeChange = (e) => {
    const vol = e.target.value / 100;
    setVolume(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!visible || !currentSong) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <audio
        ref={audioRef}
        src={currentSong.url}
        preload="metadata"
        crossOrigin="anonymous"
      />

      <div className="glass rounded-2xl p-4 w-80 border border-neon-blue/30 bg-gray-900/90 backdrop-blur-md text-white shadow-2xl">
        {/* 歌曲信息 */}
        <div className="flex items-center gap-3 mb-4">
          <img
            src={currentSong.cover || 'https://picsum.photos/300/300'}
            alt={currentSong.name}
            className="w-14 h-14 rounded-xl object-cover"
          />
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium truncate text-white">{currentSong.name}</p>
            <p className="text-xs text-gray-400 truncate">{currentSong.artist}</p>
          </div>
        </div>

        {/* 进度条 */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-gray-400 w-10 text-right">{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={handleSeek}
            className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
          <span className="text-xs text-gray-400 w-10">{formatTime(duration)}</span>
        </div>

        {/* 控制按钮 */}
        <div className="flex items-center justify-center gap-4 mb-3">
          <button onClick={handlePrev} className="p-2 hover:bg-gray-700 rounded-full transition">
            <SkipBack size={20} />
          </button>
          <button
            onClick={togglePlay}
            className="p-3 bg-purple-600 hover:bg-purple-500 rounded-full transition"
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </button>
          <button onClick={handleNext} className="p-2 hover:bg-gray-700 rounded-full transition">
            <SkipForward size={20} />
          </button>
        </div>

        {/* 音量控制 */}
        <div className="flex items-center gap-2">
          <Volume2 size={16} className="text-gray-400" />
          <input
            type="range"
            min="0"
            max="100"
            value={volume * 100}
            onChange={handleVolumeChange}
            className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
        </div>
      </div>
    </div>
  );
}
