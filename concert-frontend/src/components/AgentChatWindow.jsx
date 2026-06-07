import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Send, X, Minimize2, Bot, User, Trash2, Map, Utensils, Hotel, Car } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { agentApi } from '../utils/api';
import { useApp } from '../context/AppContext';
import { formatDate } from '../utils/helpers';
import TripPlanForm from './TripPlanForm';

const AgentChatWindow = ({
  isOpen,
  onClose,
  initialSinger = '',
  initialMessage = '',
  title = '演唱会 AI 助手',
}) => {
  const { userId, sessionId, selectedConcert, setSelectedConcert } = useApp();

  // 计算身份信息
  const identity = selectedConcert?.singer ? `${selectedConcert.singer}粉丝` : null;
  const hasIdentity = !!selectedConcert?.singer;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [showTripForm, setShowTripForm] = useState(false);

  // 根据当前上下文生成拟提问
  const suggestedQuestions = useMemo(() => {
    const singer = selectedConcert?.singer || initialSinger;
    if (!singer) return [];
    const date = selectedConcert?.showTime ? formatDate(selectedConcert.showTime, 'yyyy年MM月dd日') : '';
    const venue = selectedConcert?.venue || '';
    const city = selectedConcert?.city || '';
    return [
      {
        icon: Utensils,
        label: `演出结束后附近有什么好吃的推荐？`,
        query: `${city}${venue}附近有什么好吃的餐厅推荐？看完${singer}演唱会后想去吃点东西。`,
      },
      {
        icon: Hotel,
        label: `${city}有什么住宿推荐吗？`,
        query: `${city}有什么住宿推荐？希望离${venue}近一些，方便看完演唱会回去。`,
      },
      {
        icon: Car,
        label: `怎么去${venue}最方便？`,
        query: `怎么去${venue}最方便？演唱会在${date}举办，推荐什么出行方式？`,
      },
    ];
  }, [selectedConcert, initialSinger]);

  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    if (isOpen && !historyLoaded && sessionId) {
      loadHistory();
    }
  }, [isOpen, sessionId]);

  useEffect(() => {
    if (isOpen && initialMessage?.trim()) {
      setInput(initialMessage.trim());
    }
  }, [isOpen, initialMessage]);

  // 每次消息更新或流式内容更新时都滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent, showTripForm]);

  const loadHistory = async () => {
    if (!sessionId) return;
    try {
      const res = await agentApi.getHistory(sessionId);
      if (res.success && Array.isArray(res.data)) {
        setMessages(
          res.data.map((msg) => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: decodeResponseContent(msg.content || msg.message || String(msg)),
          }))
        );
        setHistoryLoaded(true);
      }
    } catch (e) {
      console.error('加载历史失败:', e);
    }
  };

  const handleTripFormSubmit = (requestText) => {
    setShowTripForm(false);
    setInput(requestText);
    // 自动发送
    setTimeout(() => sendMessageFromInput(requestText), 50);
  };

  // 供表单调用，不清空 input
  const sendMessageFromInput = async (textToSend) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isLoading) return;

    setStreamingContent('');
    setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
    setIsLoading(true);

    const currentSession = sessionId || '';

    try {
      abortControllerRef.current = new AbortController();

      const response = await agentApi.chatStream({
        sessionId: currentSession,
        userId,
        message: trimmed,
        concertId: selectedConcert?.id,
        identity,
        hasIdentity,
        singer: selectedConcert?.singer || initialSinger || null,
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let accumulated = '';
      let buffer = '';

      const assistantIndex = messages.length + 1;

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '', isStreaming: true },
      ]);

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
              if (token === '[DONE]') { done = true; break; }
              if (token === '[ERROR]') {
                accumulated = '网络错误，请检查连接后重试。';
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[assistantIndex] = { ...updated[assistantIndex], content: accumulated, isStreaming: false };
                  return updated;
                });
                done = true;
                break;
              }
              const decodedToken = token.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\r/g, '');
              accumulated += decodedToken;
              setMessages((prev) => {
                const updated = [...prev];
                updated[assistantIndex] = { ...updated[assistantIndex], content: accumulated };
                return updated;
              });
            }
          }
        }
      }

      setMessages((prev) => {
        const updated = [...prev];
        updated[assistantIndex] = { ...updated[assistantIndex], content: accumulated, isStreaming: false };
        return updated;
      });
    } catch (e) {
      console.error('发送消息失败:', e);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '网络错误，请检查连接后重试。' },
      ]);
    } finally {
      setIsLoading(false);
      setStreamingContent('');
      abortControllerRef.current = null;
    }
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const currentSession = sessionId || '';
    setInput('');
    await sendMessageFromInput(trimmed);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = async () => {
    if (!sessionId) return;
    try {
      await agentApi.clearSession(sessionId);
    } catch (e) {
      console.error('清空会话失败:', e);
    }
    setMessages([]);
    setStreamingContent('');
    setHistoryLoaded(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isMinimized ? (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          onClick={() => setIsMinimized(false)}
          className="fixed bottom-20 right-6 z-[60] w-14 h-14 bg-gradient-to-r from-neon-blue to-neon-purple rounded-full flex items-center justify-center shadow-lg hover:shadow-neon-blue/30 transition-shadow"
        >
          <Bot className="w-6 h-6 text-white" />
        </motion.button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.95 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-20 right-6 z-[60] w-[390px] h-[580px] rounded-2xl flex flex-col overflow-hidden shadow-2xl"
          style={{
            background: 'rgba(12,12,24,0.97)',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div
            className="flex items-center justify-between px-5 py-3.5 flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,rgba(0,229,255,0.12),rgba(168,85,247,0.12))' }}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#00e5ff,#a855f7)' }}>
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="text-white font-semibold text-sm">{title}</span>
                {initialSinger && (
                  <p className="text-white/40 text-xs">当前：{initialSinger}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="清空对话"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsMinimized(true)}
                className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && !showTripForm && (
              <div className="space-y-4">
                <div className="text-center text-white/30 py-4">
                  <Bot className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">你好！我是演唱会 AI 助手</p>
                  <p className="text-xs text-white/20 mt-1">可以问我演唱会周边美食、酒店、打车等问题</p>
                </div>
                {suggestedQuestions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-white/25 text-center">试试这样问我</p>
                    {suggestedQuestions.map((item, i) => (
                      <button
                        key={i}
                        onClick={() => setInput(item.query)}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-left text-sm transition-all"
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          color: 'rgba(255,255,255,0.7)',
                        }}
                      >
                        <item.icon className="w-4 h-4 flex-shrink-0" style={{ color: '#00e5ff' }} />
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {showTripForm && (
              <TripPlanForm
                concert={selectedConcert}
                onSubmit={handleTripFormSubmit}
                onCancel={() => setShowTripForm(false)}
                onClearConcert={() => setSelectedConcert(null)}
              />
            )}

            {messages.map((msg, index) => (
              <div key={index} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={
                    msg.role === 'user'
                      ? { background: '#3b82f6' }
                      : { background: 'linear-gradient(135deg,#00e5ff,#a855f7)' }
                  }
                >
                  {msg.role === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>
                <div
                  className="max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                  style={
                    msg.role === 'user'
                      ? { background: '#3b82f6', color: '#fff', borderBottomRightRadius: '4px' }
                      : { background: 'rgba(255,255,255,0.07)', color: '#e2e8f0', borderBottomLeftRadius: '4px' }
                  }
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
            ))}

            {isLoading && streamingContent === '' && (
              <div className="flex gap-2.5">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#00e5ff,#a855f7)' }}
                >
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div
                  className="px-4 py-3 rounded-2xl rounded-bl-none"
                  style={{ background: 'rgba(255,255,255,0.07)' }}
                >
                  <div className="flex gap-1">
                    {[0, 150, 300].map((delay) => (
                      <span
                        key={delay}
                        className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入问题，按 Enter 发送..."
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 rounded-full text-sm text-white placeholder-white/30 outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0"
                style={{
                  background: input.trim() && !isLoading
                    ? 'linear-gradient(135deg,#00e5ff,#a855f7)'
                    : 'rgba(255,255,255,0.1)',
                }}
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

function decodeResponseContent(content) {
  if (!content || typeof content !== 'string') {
    return content;
  }
  const hasReplacementChars = content.includes('�') || content.includes('?');
  if (!hasReplacementChars) {
    return content;
  }
  try {
    const repaired = decodeURIComponent(escape(content));
    return repaired || content;
  } catch {
    return content;
  }
}

export default AgentChatWindow;
