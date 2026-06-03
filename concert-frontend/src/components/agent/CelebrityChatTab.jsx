import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, User, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { celebrityApi } from '../../utils/api';

const CelebrityChatTab = () => {
  const { orchSession } = useApp();
  const [celebrities, setCelebrities] = useState([]);
  const [selectedCelebrity, setSelectedCelebrity] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingCelebrities, setLoadingCelebrities] = useState(true);
  const messagesEndRef = useRef(null);
  // 每个歌手独立的 session ID，避免聊天记录互相混淆
  const chatSessionMap = useRef({});

  const getSessionId = (singer) => {
    if (!chatSessionMap.current[singer]) {
      chatSessionMap.current[singer] = 'celeb_' + singer + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    }
    return chatSessionMap.current[singer];
  };

  useEffect(() => {
    celebrityApi.getList().then(res => {
      if (res.success && res.data) {
        setCelebrities(res.data);
        if (res.data.length > 0) setSelectedCelebrity(res.data[0]);
      }
    }).catch(console.error).finally(() => setLoadingCelebrities(false));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 加载历史记录
  const loadHistory = async (singer) => {
    try {
      const res = await celebrityApi.getHistory(getSessionId(singer));
      if (res.success && res.data?.length > 0) {
        const historyMessages = res.data.map(msg => ({
          type: msg.role === 'user' ? 'user' : 'celebrity',
          content: msg.content,
          celebrity: { name: singer, icon: celebrities.find(c => c.name === singer)?.icon || '🎤' },
        }));
        setMessages(historyMessages);
      } else {
        setMessages([]);
      }
    } catch { setMessages([]); }
  };

  const handleSelectCelebrity = (celebrity) => {
    setSelectedCelebrity(celebrity);
    setMessages([]);
    loadHistory(celebrity.name);
  };

  const handleSend = async () => {
    if (!input.trim() || loading || !selectedCelebrity) return;
    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, {
      type: 'user',
      content: userMessage,
      celebrity: selectedCelebrity,
    }]);
    setLoading(true);

    try {
      const res = await celebrityApi.chat(getSessionId(selectedCelebrity.name), selectedCelebrity.name, userMessage);
      if (res.success) {
        setMessages(prev => [...prev, {
          type: 'celebrity',
          content: res.data,
          celebrity: selectedCelebrity,
        }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        type: 'celebrity',
        content: '抱歉，服务暂时不可用，请稍后再试。',
        celebrity: selectedCelebrity,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = async () => {
    setMessages([]);
    try {
      await celebrityApi.clearSession(getSessionId(selectedCelebrity.name));
    } catch {}
  };

  if (loadingCelebrities) {
    return (
      <div className="glass rounded-2xl p-8 border border-white/10 flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-neon-purple border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">加载歌手列表...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl border border-white/10 overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-4 h-[600px]">
        {/* 左侧歌手列表 */}
        <div className="border-r border-white/10 p-4 overflow-y-auto">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-neon-purple" />
            选择歌手
          </h3>
          <div className="space-y-2">
            {celebrities.map((celebrity) => (
              <motion.button
                key={celebrity.name}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectCelebrity(celebrity)}
                className={`w-full p-3 rounded-xl border text-left transition-all ${
                  selectedCelebrity?.name === celebrity.name
                    ? 'bg-neon-purple/10 border-neon-purple'
                    : 'glass border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{celebrity.icon}</span>
                  <div>
                    <p className="font-medium text-white">{celebrity.name}</p>
                    <p className="text-xs text-gray-400">{celebrity.description}</p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* 右侧聊天窗口 */}
        <div className="md:col-span-3 flex flex-col">
          {/* 聊天头部 */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">{selectedCelebrity?.icon}</span>
              <div>
                <h3 className="font-bold text-white">{selectedCelebrity?.name}</h3>
                <p className="text-xs text-gray-400">AI 模拟对话</p>
              </div>
            </div>
            <button
              onClick={clearChat}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              清空对话
            </button>
          </div>

          {/* 消息列表 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-8">
                <p>开始和 {selectedCelebrity?.name} 聊天吧！</p>
                <p className="text-sm mt-2">试试问："你最近怎么样？" 或 "推荐一首歌给我"</p>
              </div>
            )}

            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-2 max-w-[80%] ${
                    message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      message.type === 'user'
                        ? 'bg-neon-purple'
                        : 'bg-gradient-to-r from-purple-500 to-pink-500'
                    }`}>
                      {message.type === 'user' ? (
                        <User className="w-4 h-4 text-white" />
                      ) : (
                        <span className="text-sm">{message.celebrity?.icon}</span>
                      )}
                    </div>

                    {/* 歌手气泡：浮动表情 */}
                    {message.type === 'celebrity' ? (
                      <div className="relative">
                        <motion.div
                          animate={{ y: [0, -4, 0], opacity: [0.5, 1, 0.5] }}
                          transition={{ repeat: Infinity, duration: 2.5, delay: index * 0.3 }}
                          className="absolute -top-5 left-0 text-lg select-none"
                        >
                          {message.celebrity?.icon}
                        </motion.div>
                        <div className="glass border border-white/10 text-white rounded-bl-md">
                          <p className="text-sm p-3">{message.content}</p>
                          {message.content.includes('🎵') && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="mx-3 mb-3 p-2 bg-purple-500/20 rounded-lg border border-purple-500/30 text-xs"
                            >
                              <p className="text-purple-300">🎶 {message.content.split('🎵')[1]?.split('\n')[0]}</p>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-2xl rounded-br-md bg-neon-purple text-white">
                        <p className="text-sm">{message.content}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="flex items-center space-x-2 glass border border-white/10 p-3 rounded-2xl rounded-bl-md">
                  <div className="w-2 h-2 bg-neon-purple rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-neon-purple rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-neon-purple rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 输入框 */}
          <div className="p-4 border-t border-white/10">
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={`和 ${selectedCelebrity?.name} 说点什么...`}
                className="flex-1 px-4 py-3 glass rounded-xl border border-white/10 focus:border-neon-purple/50 focus:outline-none text-white bg-transparent"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CelebrityChatTab;
