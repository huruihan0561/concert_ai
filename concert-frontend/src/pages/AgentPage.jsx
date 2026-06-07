import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, Send, X, Trash2, User, Sparkles, Utensils, Hotel, Car,
  MapPin, ChevronRight, Loader2, Plus, MessageSquare, PanelLeft, Menu, Brain
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { agentApi } from '../utils/api';
import { useApp } from '../context/AppContext';
import TripPlanForm from '../components/TripPlanForm';
import { ThinkingIndicator } from '../components/ThinkingIndicator';
import AgentThinkingPanel from '../components/AgentThinkingPanel';

const EXAMPLE_QUESTIONS = [
  { icon: Utensils, text: '演唱会场馆附近有什么好吃的？', query: '演唱会场馆附近有什么好吃的推荐？' },
  { icon: Hotel, text: '附近有哪些酒店推荐？', query: '演唱会场馆附近有什么酒店推荐？' },
  { icon: Car, text: '演唱会结束后怎么打车？', query: '演唱会结束后怎么打车最方便？' },
  { icon: MapPin, text: '场馆周边有什么好玩的？', query: '演唱会场馆周边有什么好玩的景点或娱乐？' },
];

const QUICK_ACTIONS = [
  { icon: Utensils, label: '美食推荐', desc: '场馆周边餐饮', color: '#f97316', query: '推荐演唱会场馆附近的美食', action: 'food' },
  { icon: Hotel, label: '酒店住宿', desc: '附近优质酒店', color: '#a855f7', query: '推荐演唱会场馆附近的酒店', action: 'hotel' },
  { icon: Car, label: '出行打车', desc: '交通出行方案', color: '#3b82f6', query: '怎么去演唱会场馆最方便', action: 'ride' },
  { icon: MapPin, label: '周边攻略', desc: '景点与玩乐', color: '#22c55e', query: '演唱会场馆周边有什么好玩的', action: 'tour' },
  { icon: Sparkles, label: '行程规划', desc: '智能定制方案', color: '#FFD100', query: '帮我规划演唱会行程', action: 'trip-plan' },
];

const AgentPage = () => {
  const { userId, setSessionId, selectedConcert, setSelectedConcert } = useApp();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showTripForm, setShowTripForm] = useState(false);
  const [showThinkingPanel, setShowThinkingPanel] = useState(false);
  const messagesEndRef = useRef(null);

  // 加载对话列表和恢复当前对话
  useEffect(() => {
    loadConversations();
    // 恢复上次浏览的对话
    const savedCurrent = localStorage.getItem(`current_conversation_${userId}`);
    if (savedCurrent) {
      setCurrentConversationId(savedCurrent);
      setSessionId(savedCurrent);
      // 检查是否有历史消息
      loadHistory(savedCurrent).then(() => {
        setHasStartedChat(true);
      });
    }
    
    // 隐藏页面滚动条
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    
    return () => {
      // 恢复页面滚动条
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [userId]);

  const loadConversations = () => {
    const saved = localStorage.getItem(`conversations_${userId}`);
    if (saved) {
      setConversations(JSON.parse(saved));
    }
  };

  const saveConversations = (convs) => {
    localStorage.setItem(`conversations_${userId}`, JSON.stringify(convs));
    setConversations(convs);
  };

  // 创建新对话
  const createNewConversation = () => {
    const newId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newConversation = {
      id: newId,
      title: '新对话',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updated = [newConversation, ...conversations];
    saveConversations(updated);
    setCurrentConversationId(newId);
    setSessionId(newId);
    setMessages([]);
    setHasStartedChat(false);
    // 不再自动关闭侧边栏，只有点击关闭按钮才能收起
    // setShowSidebar(false);
    // 保存当前对话ID到localStorage，刷新后恢复
    localStorage.setItem(`current_conversation_${userId}`, newId);
  };

  // 切换对话
  const switchConversation = (convId) => {
    setCurrentConversationId(convId);
    setSessionId(convId);
    setMessages([]);
    setHasStartedChat(true);
    // 不再自动关闭侧边栏，只有点击关闭按钮才能收起
    // setShowSidebar(false);
    // 保存当前对话ID到localStorage，刷新后恢复
    localStorage.setItem(`current_conversation_${userId}`, convId);
    // 加载历史消息
    loadHistory(convId);
  };

  // 加载历史
  const loadHistory = async (convId) => {
    try {
      const res = await agentApi.getHistory(convId);
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setMessages(
          res.data.map((msg) => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: decodeResponseContent(msg.content || msg.message || String(msg)),
          }))
        );
        return true;
      }
      return false;
    } catch (e) {
      console.error('加载历史失败:', e);
      return false;
    }
  };

  // 删除对话
  const deleteConversation = (convId, e) => {
    e.stopPropagation();
    const updated = conversations.filter(c => c.id !== convId);
    saveConversations(updated);
    if (currentConversationId === convId) {
      // 如果删除的是当前对话，切换到另一个对话或清空状态
      if (updated.length > 0) {
        // 切换到列表中的第一个对话
        const firstConv = updated[0];
        setCurrentConversationId(firstConv.id);
        setSessionId(firstConv.id);
        setMessages([]);
        setHasStartedChat(true);
        localStorage.setItem(`current_conversation_${userId}`, firstConv.id);
        loadHistory(firstConv.id);
      } else {
        // 没有对话了，清空状态，由用户手动创建新对话
        setCurrentConversationId(null);
        setSessionId(null);
        setMessages([]);
        setHasStartedChat(false);
        localStorage.removeItem(`current_conversation_${userId}`);
      }
    }
  };

  // 更新对话标题
  const updateConversationTitle = (convId, firstUserMessage) => {
    const title = firstUserMessage.slice(0, 20) + (firstUserMessage.length > 20 ? '...' : '');
    const updated = conversations.map(c => 
      c.id === convId ? { ...c, title, updatedAt: Date.now() } : c
    );
    saveConversations(updated);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 每次消息更新都滚动到底部，切换页面后也滚动到底部
  useEffect(() => {
    if (hasStartedChat) {
      scrollToBottom();
    }
  }, [messages, hasStartedChat]);

  const sendMessage = async (text) => {
    const trimmed = text || input.trim();
    if (!trimmed || isLoading) return;

    let convId = currentConversationId;
    if (!hasStartedChat) {
      convId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setCurrentConversationId(convId);
      setSessionId(convId);
      setHasStartedChat(true);

      const newConversation = {
        id: convId,
        title: trimmed.slice(0, 20) + (trimmed.length > 20 ? '...' : ''),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      saveConversations([newConversation, ...conversations]);
    } else if (messages.length === 0) {
      updateConversationTitle(convId, trimmed);
    }

    if (!text) setInput('');
    const userMsg = { role: 'user', content: trimmed };
    
    // 先添加用户消息
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    let accumulated = '';

    try {
      const response = await agentApi.chatStream({
        sessionId: convId,
        userId,
        message: trimmed,
        hasIdentity: false,
        identity: null,
        singer: null,
        concertId: null,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let buffer = '';

      // 先添加空的助手消息
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          buffer += decoder.decode(value, { stream: !done });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const token = line.slice(6).trim();
              if (token === '[DONE]') {
                done = true;
                break;
              }
              if (token === '[ERROR]') {
                accumulated = '网络错误，请检查连接后重试。';
                done = true;
                break;
              }
              // 使用JSON.parse来正确解码Unicode字符（包括emoji）
              let decodedToken;
              try {
                // 尝试将token作为JSON字符串解析
                decodedToken = JSON.parse(`"${token}"`);
              } catch {
                // 如果解析失败，使用简单的替换方法
                decodedToken = token
                  .replace(/\\n/g, '\n')
                  .replace(/\\t/g, '\t')
                  .replace(/\\r/g, '')
                  .replace(/\\u([0-9a-fA-F]{4})/g, (match, grp) => String.fromCharCode(parseInt(grp, 16)));
              }
              accumulated += decodedToken;
              setMessages((prev) => {
                const updated = [...prev];
                // 总是更新最后一条消息
                if (updated.length > 0) {
                  updated[updated.length - 1] = { ...updated[updated.length - 1], content: accumulated };
                }
                return updated;
              });
            }
          }
        }
      }

      setMessages((prev) => {
        const updated = [...prev];
        if (updated.length > 0) {
          updated[updated.length - 1] = { ...updated[updated.length - 1], content: accumulated };
        }
        return updated;
      });
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: '网络错误，请检查连接后重试。' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleQuickAction = (action, query) => {
    if (action === 'trip-plan') {
      setShowTripForm(true);
    } else {
      sendMessage(query);
    }
  };

  const handleTripFormSubmit = (requestText) => {
    setShowTripForm(false);
    sendMessage(requestText);
  };

  return (
    <div
      className="fixed inset-0 z-40 overflow-hidden"
      style={{ top: '64px' }}
    >
      {/* Sidebar - 对话列表 */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute left-0 top-0 bottom-0 flex flex-col"
            style={{ background: 'rgba(4,5,17,0.95)', backdropFilter: 'blur(10px)', borderRight: '1px solid rgba(255,255,255,0.06)', zIndex: 50 }}
          >
            {/* Header with close button */}
            <div className="p-4 flex items-center justify-between">
              <span className="text-white font-medium">对话列表</span>
              <button
                onClick={() => setShowSidebar(false)}
                className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
            </div>

            {/* New conversation button */}
            <div className="p-4">
              <button
                onClick={createNewConversation}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#00e5ff,#a855f7)' }}
              >
                <Plus className="w-4 h-4" />
                新对话
              </button>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => switchConversation(conv.id)}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                    currentConversationId === conv.id
                      ? 'bg-white/10'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <MessageSquare className={`w-4 h-4 flex-shrink-0 ${
                    currentConversationId === conv.id ? 'text-[#00e5ff]' : 'text-white/40'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${
                      currentConversationId === conv.id ? 'text-white font-medium' : 'text-white/70'
                    }`}>
                      {conv.title}
                    </p>
                  </div>
                  <button
                    onClick={(e) => deleteConversation(conv.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-white/30 hover:text-red-400 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {conversations.length === 0 && (
                <div className="text-center py-8 text-white/30 text-sm">
                  <p>暂无对话</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div
        className="h-full"
        style={{ marginLeft: showSidebar ? '260px' : '0' }}
      >
        <div className="h-full flex flex-col max-w-3xl mx-auto px-4">
          {!hasStartedChat ? (
            // 初始状态
            <div className="flex-1 flex flex-col justify-start pt-16 overflow-y-auto">
              {/* Top toolbar */}
              <div className="flex items-center gap-2 mb-8">
                {!showSidebar && (
                  <button
                    onClick={() => setShowSidebar(true)}
                    className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                  >
                    <PanelLeft className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={createNewConversation}
                  className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                  title="新对话"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Title */}
              {!showTripForm && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-10"
              >
                <h1 className="text-4xl font-bold text-white mb-3">
                  有什么可以帮你的？
                </h1>
                <p className="text-white/40">
                  周边美食 · 酒店住宿 · 出行打车 · 行程规划
                </p>
              </motion.div>
              )}

              {/* 行程规划表单 - 在标题之后显示 */}
              {showTripForm && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6"
                >
                  <TripPlanForm
                    concert={selectedConcert}
                    onSubmit={handleTripFormSubmit}
                    onCancel={() => setShowTripForm(false)}
                    onBack={() => setShowTripForm(false)}
                    onClearConcert={() => setSelectedConcert(null)}
                  />
                </motion.div>
              )}

              {/* Large input box */}
              {!showTripForm && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-6"
              >
                <div
                  className="rounded-2xl p-4"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)'
                  }}
                >
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="输入你想了解的演唱会相关问题..."
                    className="w-full h-24 bg-transparent text-white placeholder-white/30 resize-none outline-none text-base"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setShowTripForm(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-neon-blue hover:bg-neon-blue/10 border border-neon-blue/30 transition-all"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        行程规划
                      </button>
                      <div className="text-xs text-white/30">
                        按 Enter 发送，Shift + Enter 换行
                      </div>
                    </div>
                    <button
                      id="agent-send-btn"
                      onClick={() => sendMessage()}
                      disabled={!input.trim() || isLoading}
                      className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                      style={{
                        background: input.trim() && !isLoading
                          ? 'linear-gradient(135deg,#00e5ff,#a855f7)'
                          : 'rgba(255,255,255,0.08)',
                      }}
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      ) : (
                        <Send className="w-5 h-5 text-white" />
                      )}
                    </button>
                  </div>
                </div>
          </motion.div>
              )}

          {/* Quick action cards */}
          {!showTripForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-5 gap-3 mb-10 justify-items-center">
          {QUICK_ACTIONS.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              className="flex flex-col items-center p-4 rounded-2xl transition-all w-full"
              style={{
                background: item.action === 'trip-plan' ? 'rgba(0,229,255,0.08)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${item.action === 'trip-plan' ? 'rgba(0,229,255,0.2)' : 'rgba(255,255,255,0.06)'}`,
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                style={{ background: `${item.color}15` }}
              >
                <item.icon className="w-6 h-6" style={{ color: item.color }} />
              </div>
              <p className="text-white text-sm font-medium">{item.label}</p>
              <p className="text-white/40 text-xs mt-1">{item.desc}</p>
            </motion.div>
          ))}
          </motion.div>
              )}

          {/* Example questions */}
          {!showTripForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
                <p className="text-white/30 text-xs mb-3 text-center">试试这样问我</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {EXAMPLE_QUESTIONS.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        if (showTripForm) {
                          // 如果显示行程规划表单，只填充输入框
                          setInput(item.query);
                        } else {
                          // 否则直接发送
                          sendMessage(item.query);
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2 rounded-full text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)'
                      }}
                    >
                      <item.icon className="w-3.5 h-3.5" />
                      {item.text}
                    </button>
                  ))}
                </div>
              </motion.div>
              )}

            </div>
          ) : (
            // 聊天状态
            <div className="flex-1 flex flex-col min-h-0">
              {/* Top toolbar */}
              <div className="flex items-center gap-2 py-4">
                {!showSidebar && (
                  <button
                    onClick={() => setShowSidebar(true)}
                    className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                  >
                    <PanelLeft className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={() => createNewConversation()}
                  className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                  title="新对话"
                >
                  <Plus className="w-5 h-5" />
                </button>
                <div className="flex-1" />
                <button
                  onClick={() => setShowThinkingPanel(v => !v)}
                  className={`p-2 rounded-lg transition-all ${showThinkingPanel ? 'text-neon-blue bg-neon-blue/10' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
                  title="AI 推理链路"
                >
                  <Brain className="w-5 h-5" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 min-h-0 overflow-y-auto space-y-6 pr-2 scrollbar-thin">
                {messages.map((msg, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className="flex-shrink-0">
                      {msg.role === 'user' ? (
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      ) : (
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ background: 'linear-gradient(135deg,#00e5ff,#a855f7)' }}
                        >
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                    <div className={`flex-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                      <div
                        className={`inline-block max-w-[85%] px-5 py-3 rounded-2xl text-left ${
                          msg.role === 'user'
                            ? 'bg-blue-500 text-white rounded-br-none'
                            : 'bg-white/5 text-white/90 rounded-bl-none'
                        }`}
                      >
                        {msg.role === 'assistant' ? (
                          <div className="prose prose-invert prose-sm max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}

                {isLoading && <ThinkingIndicator />}
                <div ref={messagesEndRef} />
              </div>

              {/* Input area - inside the flex column */}
              <div className="pt-3 pb-2">
                <div
                  className="flex items-end gap-3 rounded-2xl p-3"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}
                >
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="输入消息..."
                    disabled={isLoading}
                    className="flex-1 bg-transparent text-white placeholder-white/30 resize-none outline-none max-h-32 min-h-[44px] py-2.5 px-2"
                    rows={1}
                    style={{ height: 'auto' }}
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || isLoading}
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0 mb-0.5"
                    style={{
                      background: input.trim() && !isLoading
                        ? 'linear-gradient(135deg,#00e5ff,#a855f7)'
                        : 'rgba(255,255,255,0.08)',
                    }}
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    ) : (
                      <Send className="w-5 h-5 text-white" />
                    )}
                  </button>
                </div>
                {showTripForm && (
                  <div className="mt-3">
                    <TripPlanForm
                      concert={{ singer: '', city: '', venue: '', showTime: '' }}
                      onSubmit={handleTripFormSubmit}
                      onCancel={() => setShowTripForm(false)}
                    />
                  </div>
                )}
                <p className="text-center text-white/20 text-xs mt-2">
                  AI 助手可能会生成不准确的信息，请核实重要信息
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI 推理链路可视化面板 */}
      <AgentThinkingPanel
        sessionId={currentConversationId}
        visible={showThinkingPanel && hasStartedChat}
        onClose={() => setShowThinkingPanel(false)}
      />

      {/* Custom scrollbar styles */}
      <style>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 8px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.05);
          border-radius: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(0,229,255,0.4);
          border-radius: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(0,229,255,0.6);
        }

        /* Table styles */
        .prose table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;
          font-size: 0.875rem;
        }

        .prose th,
        .prose td {
          padding: 0.5rem 0.75rem;
          text-align: left;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .prose th {
          background-color: rgba(0, 229, 255, 0.1);
          font-weight: 600;
          color: #fff;
        }

        .prose tbody tr:nth-child(even) {
          background-color: rgba(255, 255, 255, 0.02);
        }

        .prose tbody tr:hover {
          background-color: rgba(255, 255, 255, 0.05);
        }

        .prose th:first-child,
        .prose td:first-child {
          border-left: none;
        }

        .prose th:last-child,
        .prose td:last-child {
          border-right: none;
        }

        .prose thead tr th:first-child {
          border-top-left-radius: 0.375rem;
        }

        .prose thead tr th:last-child {
          border-top-right-radius: 0.375rem;
        }

        .prose tbody tr:last-child td:first-child {
          border-bottom-left-radius: 0.375rem;
        }

        .prose tbody tr:last-child td:last-child {
          border-bottom-right-radius: 0.375rem;
        }
      `}</style>
    </div>
  );
};

function decodeResponseContent(content) {
  if (!content || typeof content !== 'string') return content;
  const hasReplacementChars = content.includes('�') || content.includes('?');
  if (!hasReplacementChars) return content;
  try {
    const bytes = new Uint8Array([...content].map(c => c.charCodeAt(0)));
    const decoder = new TextDecoder('utf-8');
    const decoded = decoder.decode(bytes);
    return decoded;
  } catch {
    return content;
  }
}

export default AgentPage;
