import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Navbar from './components/Navbar';
import ReminderPolling from './components/ReminderPolling';
import FuturisticScene from './components/FuturisticScene';
import GlobalPlayer from './components/GlobalPlayer';
import Home from './pages/Home';
import Concerts from './pages/Concerts';
import ConcertDetail from './pages/ConcertDetail';
import AgentPage from './pages/AgentPage';
import Profile from './pages/Profile';
import RemindersPage from './pages/RemindersPage';
import MusicPlayerPage from './pages/MusicPage';
import { musicApi } from './utils/api';

function AppShell() {
  const [songs, setSongs] = useState([]);
  const [currentSinger, setCurrentSinger] = useState('');
  const [playerVersion, setPlayerVersion] = useState(0);
  const [playerState, setPlayerState] = useState({
    playing: false,
    songTitle: '',
    songArtist: '',
    cover: '',
    duration: '',
    currentTime: '',
    hasPlayed: false,
  });
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'playerState') {
        setPlayerState({
          playing: event.data.playing,
          songTitle: event.data.songTitle,
          songArtist: event.data.songArtist,
          cover: event.data.cover,
          duration: event.data.duration,
          currentTime: event.data.currentTime,
          hasPlayed: event.data.hasPlayed || false,
        });
      } else if (event.data && event.data.type === 'backToHome') {
        navigate('/');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [navigate]);

  const handleSelectSinger = (singer, options = {}) => {
    setCurrentSinger(singer);
    if (options.autoplay) {
      setPlayerVersion((prev) => prev + 1);
    }
  };

  React.useEffect(() => {
    const loadSongs = async () => {
      if (!currentSinger) {
        setSongs([]);
        return;
      }
      try {
        const artistSongs = await musicApi.getArtistSongs(currentSinger);
        setSongs(Array.isArray(artistSongs) ? artistSongs : []);
      } catch (error) {
        console.error('加载歌单失败:', error);
        setSongs([]);
      }
    };
    loadSongs();
  }, [currentSinger]);

  const playerSongs = useMemo(() => songs.filter((s) => s.url), [songs]);
  const isMusicPage = location.pathname === '/music';

  return (
    <div className={`relative min-h-screen bg-[#040511] text-white ${playerState.songTitle && !isMusicPage ? 'pb-20' : ''}`}>
      {/* 科幻 3D 背景 */}
      <FuturisticScene className="fixed inset-0 z-0" />

      {/* 主内容 */}
      <div className="relative z-10">
        <ReminderPolling />
        <Navbar />
        <Routes>
            <Route path="/" element={<Home onSelectSinger={handleSelectSinger} />} />
            <Route path="/home" element={<Home onSelectSinger={handleSelectSinger} />} />
            <Route path="/concerts" element={<Concerts onSelectSinger={handleSelectSinger} />} />
            <Route path="/concerts/:id" element={<ConcertDetail onSelectSinger={handleSelectSinger} />} />
            <Route path="/agent" element={<AgentPage onSelectSinger={handleSelectSinger} />} />
            <Route path="/profile" element={<Profile onSelectSinger={handleSelectSinger} />} />
            <Route path="/reminders" element={<RemindersPage />} />
            <Route path="/music" element={<MusicPlayerPage />} />
          </Routes>
      </div>

      {/* 全局播放控制栏 */}
      {!isMusicPage && playerState.songTitle && playerState.hasPlayed && (
        <GlobalPlayer playerState={playerState} />
      )}
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}

export default App;
