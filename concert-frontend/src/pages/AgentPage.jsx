import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle, Radio, Map, Bot, ChevronRight, Zap
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { orchestratorApi } from '../utils/api';
import Planning from '../pages/Planning';
import ConcertScene3D from '../components/ConcertScene3D';
import CelebrityChatTab from '../components/agent/CelebrityChatTab';
import MusicRadioTab from '../components/agent/MusicRadioTab';


const TABS = [
  { id: 'planning', label: '智能规划', icon: Map, color: 'from-blue-500 to-cyan-500', glow: '#00f3ff', desc: 'AI定制你的演唱会行程' },
  { id: 'celebrity', label: '歌手对话', icon: MessageCircle, color: 'from-purple-500 to-pink-500', glow: '#ff00ff', desc: '与偶像AI实时聊天' },
  { id: 'music', label: '情绪电台', icon: Radio, color: 'from-orange-500 to-red-500', glow: '#ff6b6b', desc: '根据心情推荐歌单' },
];

const AgentPage = ({ onSelectSinger }) => {
  const { orchSession } = useApp();
  const [activeTab, setActiveTab] = useState('planning');
  const [sessionInfo, setSessionInfo] = useState(null);

  useEffect(() => {
    if (!orchSession) return;
    orchestratorApi.getSession(orchSession).then(res => {
      if (res.success) setSessionInfo(res.data);
    }).catch(console.error);
  }, [orchSession]);

  const ActiveTabComponent = {
    planning: Planning,
    celebrity: CelebrityChatTab,
    music: MusicRadioTab,
  }[activeTab] || Planning;

  const activeTabInfo = TABS.find(t => t.id === activeTab);

  return (
    <div className="min-h-screen pt-16 flex">
      {/* 3D 舞台背景 */}
      <div className="fixed inset-0 z-0 opacity-80">
        <ConcertScene3D className="w-full h-full" />
      </div>

      {/* 主内容区 */}
      <div className="relative z-10 w-full flex flex-col">
        {/* 顶部渐变遮罩 */}
        <div className="flex-shrink-0">
          <div className="bg-gradient-to-b from-black/60 via-black/30 to-transparent pt-6 pb-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Hero 标题 */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className="text-center mb-6"
              >
                {/* 状态标签 */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full border border-white/10 bg-black/30 backdrop-blur-md mb-5"
                >
                  <div className="relative flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
                    <Bot className="w-4 h-4 text-neon-blue" />
                    <span className="text-sm text-white/90 font-medium tracking-wide">演唱会专属 AI 管家</span>
                  </div>
                </motion.div>

                <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight leading-tight">
                  一站式演唱会{' '}
                  <span className="bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink bg-clip-text text-transparent">
                    智能助手
                  </span>
                </h1>
                <p className="text-base text-white/50 max-w-md mx-auto">
                  选艺人 · 查行程 · 定酒店 · 听歌单 · 生成纪念，AI 全程搞定
                </p>
              </motion.div>

              {/* Tab 导航 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.5 }}
              >
                <div className="flex items-center justify-center space-x-2 md:space-x-3">
                  {TABS.map((tab, i) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <motion.button
                        key={tab.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.05 }}
                        whileHover={{ scale: 1.03, y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                          relative flex items-center space-x-2 px-4 md:px-5 py-3 rounded-2xl transition-all duration-300
                          ${isActive
                            ? 'bg-gradient-to-br ' + tab.color + ' shadow-lg'
                            : 'glass border border-white/10 hover:border-white/25 hover:bg-white/5'
                          }
                        `}
                        style={isActive ? { boxShadow: `0 0 20px ${tab.glow}40, 0 8px 24px rgba(0,0,0,0.3)` } : {}}
                      >
                        <div className={`
                          p-1.5 rounded-xl transition-all
                          ${isActive ? 'bg-white/20' : ''}
                        `}>
                          <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-white/60'}`} />
                        </div>
                        <div className="text-left">
                          <p className={`text-sm font-bold ${isActive ? 'text-white' : 'text-white/80'}`}>{tab.label}</p>
                          {isActive && (
                            <motion.p
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="text-xs text-white/60 hidden sm:block"
                            >
                              {tab.desc}
                            </motion.p>
                          )}
                        </div>
                        {isActive && (
                          <motion.div
                            layoutId="activeTabIndicator"
                            className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full"
                            style={{ background: tab.glow }}
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>

              {/* 上下文卡片 */}
              {sessionInfo && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 flex justify-center"
                >
                  <div className="inline-flex items-center space-x-3 px-4 py-2 rounded-full glass border border-white/10">
                    {[
                      { label: '歌手', value: sessionInfo.selectedSinger, icon: '🎤' },
                      { label: '城市', value: sessionInfo.concertCity, icon: '📍' },
                      { label: '预算', value: sessionInfo.budgetLevel, icon: '💰' },
                      { label: '心情', value: sessionInfo.mood, icon: '💫' },
                    ].filter(f => f.value).map((f, i) => (
                      <div key={i} className="flex items-center space-x-1.5">
                        <span className="text-sm">{f.icon}</span>
                        <span className="text-xs text-white/60">{f.label}:</span>
                        <span className="text-xs font-medium text-white">{f.value}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Tab 内容 */}
        <div className="flex-1 px-4 sm:px-6 lg:px-8 pb-8">
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="mt-4"
              >
                <ActiveTabComponent onSelectSinger={onSelectSinger} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentPage;
