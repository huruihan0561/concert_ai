import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Navbar from './components/Navbar';
import MusicPlayer from './components/MusicPlayer';
import ParticleBackground from './components/ParticleBackground';
import Home from './pages/Home';
import Concerts from './pages/Concerts';
import Venue from './pages/Venue';
import AgentPage from './pages/AgentPage';
import { musicApi } from './utils/api';

function App() {
  const [songs, setSongs] = useState([]);
  const [currentSinger, setCurrentSinger] = useState(null);

  // 监听歌手变化，加载歌单
  useEffect(() => {
    const loadSongs = async () => {
      if (currentSinger) {
        try {
          const artistSongs = await musicApi.getArtistSongs(currentSinger);
          if (artistSongs && artistSongs.length > 0) {
            setSongs(artistSongs);
          }
        } catch (error) {
          console.error('加载歌单失败:', error);
        }
      }
    };
    loadSongs();
  }, [currentSinger]);

  return (
    <AppProvider>
      <div className="relative min-h-screen">
        <ParticleBackground />
        <div className="relative z-10">
          <Navbar />
          <Routes>
            <Route path="/" element={<AgentPage onSelectSinger={setCurrentSinger} />} />
            <Route path="/concerts" element={<Concerts onSelectSinger={setCurrentSinger} />} />
            <Route path="/venue" element={<Venue />} />
            <Route path="/agent" element={<AgentPage onSelectSinger={setCurrentSinger} />} />
          </Routes>
          <MusicPlayer songs={songs} visible={songs.length > 0} />
        </div>
      </div>
    </AppProvider>
  );
}

export default App;
