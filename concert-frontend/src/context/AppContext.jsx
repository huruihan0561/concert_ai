import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { orchestratorApi } from '../utils/api';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};

export const AppProvider = ({ children }) => {
  const [selectedConcert, setSelectedConcert] = useState(null);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [playlist, setPlaylist] = useState([]);
  const [loading, setLoading] = useState(false);

  // ── 统一会话管理（文档流程：进入页面 → new-session → 存储 sessionId）────────
  const [orchSession, setOrchSession] = useState(() => {
    const stored = localStorage.getItem('orch_session_id');
    return stored || null;
  });
  const [orchUserId] = useState(() => {
    let uid = localStorage.getItem('orch_user_id');
    if (!uid) {
      uid = String(Math.floor(Math.random() * 99999) + 10000);
      localStorage.setItem('orch_user_id', uid);
    }
    return uid;
  });

  // 初始化：没有 sessionId 则新建
  useEffect(() => {
    if (!orchSession) {
      orchestratorApi.newSession().then(res => {
        if (res.success) {
          localStorage.setItem('orch_session_id', res.data);
          setOrchSession(res.data);
        }
      }).catch(console.error);
    }
  }, [orchSession]);

  const selectConcert = useCallback((concert) => {
    setSelectedConcert(concert);
    setCurrentPlan(null);
  }, []);

  const updatePlan = useCallback((plan) => setCurrentPlan(plan), []);

  const togglePlay = useCallback(() => setIsPlaying(prev => !prev), []);

  const playTrack = useCallback((track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
  }, []);

  const setPlaylistData = useCallback((tracks) => {
    setPlaylist(tracks);
    if (tracks.length > 0) {
      const trackExists = currentTrack && tracks.find(t => t.id === currentTrack.id);
      if (!currentTrack || !trackExists) setCurrentTrack(tracks[0]);
    }
  }, [currentTrack]);

  const value = {
    selectedConcert, currentPlan, isPlaying, currentTrack, playlist, loading, setLoading,
    selectConcert, updatePlan, togglePlay, playTrack, setPlaylistData,
    // 统一会话
    orchSession, orchUserId,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
