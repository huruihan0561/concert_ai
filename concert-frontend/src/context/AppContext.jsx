import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { getStoredSessionId, setStoredSessionId, getStoredUserId } from '../utils/helpers';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};

const SESSION_KEY_CONCERT = 'concertai_selected_concert';

// 内部版本号，用于触发跨组件重渲染
let _concertVersion = 0;
const _versionSubscribers = new Set();

function getStoredConcert() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY_CONCERT);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// 对外暴露：写入 sessionStorage 并通知所有订阅者重读
export function setSelectedConcert(concert) {
  if (concert) {
    sessionStorage.setItem(SESSION_KEY_CONCERT, JSON.stringify(concert));
  } else {
    sessionStorage.removeItem(SESSION_KEY_CONCERT);
  }
  _concertVersion++;
  _versionSubscribers.forEach(fn => fn(_concertVersion));
}

export const AppProvider = ({ children }) => {
  const userId = useMemo(() => getStoredUserId(), []);
  const sessionId = useMemo(() => getStoredSessionId(), []);

  // 版本号 state，订阅全局 _concertVersion 变化
  const [concertVersion, setConcertVersion] = useState(_concertVersion);

  useEffect(() => {
    _versionSubscribers.add(setConcertVersion);
    return () => {
      _versionSubscribers.delete(setConcertVersion);
    };
  }, []);

  // selectedConcert 依赖版本号，每次版本变化自动重新读取 sessionStorage
  const selectedConcert = useMemo(getStoredConcert, [concertVersion]);

  const value = useMemo(
    () => ({
      selectedConcert,
      setSelectedConcert,
      userId,
      sessionId,
      setSessionId: setStoredSessionId,
    }),
    [selectedConcert, userId, sessionId]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
