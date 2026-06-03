import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, MapPin, Calendar, Sparkles, ArrowRight, Star, Send, Bot, Loader2, Check, Zap, ChevronDown, Compass } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Countdown from '../components/Countdown';
import ConcertCard from '../components/ConcertCard';
import { concertApi, orchestratorApi } from '../utils/api';
import { useApp } from '../context/AppContext';

// ============================================================
//  全屏启动页
// ============================================================
const SplashScreen = ({ onExplore }) => {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'linear-gradient(135deg, #050510 0%, #0a0a1a 50%, #0f0520 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* 背景粒子光效 */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            borderRadius: '50%',
            filter: 'blur(80px)',
            opacity: 0.15,
            top: `${15 + i * 14}%`,
            left: `${5 + i * 16}%`,
            width: `${180 + i * 40}px`,
            height: `${180 + i * 40}px`,
            background: i % 2 === 0 ? '#00e5ff' : '#a855f7',
            animation: `float ${3 + i * 0.7}s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.4}s`,
          }} />
        ))}
      </div>

      {/* 装饰线 */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {[...Array(3)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            height: '1px',
            width: '100%',
            top: `${20 + i * 30}%`,
            background: `linear-gradient(90deg, transparent, rgba(0,229,255,0.1), rgba(168,85,247,0.1), transparent)`,
          }} />
        ))}
      </div>

      {/* Logo 大标 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: 'relative', marginBottom: '20px' }}
      >
        {/* 外圈光环 */}
        <div style={{
          position: 'absolute', inset: '-20px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,229,255,0.08) 0%, transparent 70%)',
          animation: 'pulse-ring 3s ease-in-out infinite',
        }} />
        <div style={{
          width: '96px', height: '96px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #00e5ff, #a855f7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 40px rgba(0,229,255,0.3), 0 0 80px rgba(168,85,247,0.15)',
          position: 'relative',
        }}>
          <Sparkles size={40} color="white" strokeWidth={1.5} />
          {/* 内光 */}
          <div style={{
            position: 'absolute', inset: '4px', borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.2), transparent)',
          }} />
        </div>
      </motion.div>

      {/* 品牌名 */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.7 }}
        style={{ textAlign: 'center', marginBottom: '8px' }}
      >
        <h1 style={{
          fontSize: '32px', fontWeight: '900', letterSpacing: '-0.5px',
          background: 'linear-gradient(135deg, #00e5ff, #a855f7, #ec4899)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          ConcertAI
        </h1>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', letterSpacing: '6px', textTransform: 'uppercase', marginTop: '4px' }}>
          演唱会专属攻略助手
        </p>
      </motion.div>

      {/* 副标题 */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        style={{ fontSize: '14px', color: 'rgba(255,255,255,0.3)', marginBottom: '48px', textAlign: 'center', maxWidth: '260px', lineHeight: '1.7' }}
      >
        全国演唱会一站式 AI 助手<br />交通 · 酒店 · 游玩 · 氛围
      </motion.p>

      {/* 开始探索按钮 */}
      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        onClick={onExplore}
        whileHover={{ scale: 1.04, boxShadow: '0 0 32px rgba(0,229,255,0.3)' }}
        whileTap={{ scale: 0.97 }}
        style={{
          padding: '14px 40px',
          background: 'linear-gradient(135deg, #00e5ff, #a855f7)',
          border: 'none', borderRadius: '50px',
          fontSize: '15px', fontWeight: '700', color: 'white',
          cursor: 'pointer', letterSpacing: '0.5px',
          boxShadow: '0 0 24px rgba(0,229,255,0.2), 0 0 48px rgba(168,85,247,0.1)',
          display: 'flex', alignItems: 'center', gap: '10px',
          marginBottom: '40px',
        }}
      >
        <Compass size={16} />
        开始探索
      </motion.button>

      {/* 向下箭头 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.5 }}
        style={{
          position: 'absolute', bottom: '32px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
          cursor: 'pointer',
        }}
        onClick={onExplore}
      >
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', letterSpacing: '2px', textTransform: 'uppercase' }}>scroll</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
        >
          <ChevronDown size={18} color="rgba(255,255,255,0.25)" />
        </motion.div>
      </motion.div>

      <style>{`
        @keyframes pulse-ring {
          0%, 100% { transform: scale(1); opacity: 0.15; }
          50% { transform: scale(1.08); opacity: 0.22; }
        }
        @keyframes float {
          from { transform: translateY(0px) scale(1); }
          to { transform: translateY(-20px) scale(1.05); }
        }
      `}</style>
    </motion.div>
  );
};

const THINK_STEPS = [
  '🔍 解析你的需求...',
  '🤖 调度 AI Agent...',
  '🎵 整合信息资源...',
  '✨ 生成回复内容...',
];

const Home = () => {
  const [featuredConcerts, setFeaturedConcerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { selectConcert, orchSession, orchUserId } = useApp();
  const navigate = useNavigate();

  const [chatInput, setChatInput] = useState('');
  const [orchMessages, setOrchMessages] = useState([]);
  const [orchLoading, setOrchLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const chatEndRef = useRef(null);
  const stepTimerRef = useRef(null);

  useEffect(() => {
    const fetchConcerts = async () => {
      try {
        const response = await concertApi.getConcerts({ page: 0, size: 6 });
        if (response.success && response.data) {
          setFeaturedConcerts(response.data.records || []);
        }
      } catch (error) {
        console.error('Failed to fetch concerts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConcerts();
  }, []);

  // 自动滚动对话
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [orchMessages]);

  const handleOrchChat = async () => {
    if (!chatInput.trim() || orchLoading) return;
    const input = chatInput.trim();
    setChatInput('');
    setOrchMessages(prev => [...prev, { role: 'user', content: input }]);
    setOrchLoading(true);

    setCurrentStep(0);
    stepTimerRef.current = setInterval(() => {
      setCurrentStep(prev => prev < THINK_STEPS.length - 1 ? prev + 1 : prev);
    }, 600);

    try {
      if (orchSession) {
        const res = await orchestratorApi.chat(orchSession, Number(orchUserId), input);
        if (res.success) {
          setOrchMessages(prev => [...prev, { role: 'assistant', content: res.data }]);
        }
      } else {
        // 无 session，直接跳转规划页
        setOrchMessages(prev => [...prev, {
          role: 'assistant',
          content: '好的，正在为你跳转行程规划页面...'
        }]);
        setTimeout(() => navigate('/agent/planning'), 1000);
      }
    } catch (err) {
      setOrchMessages(prev => [...prev, {
        role: 'assistant',
        content: '抱歉，服务暂时不可用，请稍后重试。'
      }]);
    } finally {
      clearInterval(stepTimerRef.current);
      setOrchLoading(false);
      setCurrentStep(-1);
    }
  };

  const features = [
    {
      icon: Music,
      title: '智能行程规划',
      description: 'AI 根据您的预算和偏好，自动生成最优演唱会出行方案',
      color: 'from-neon-blue to-cyan-500',
    },
    {
      icon: MapPin,
      title: '3D 场馆预览',
      description: '沉浸式 3D 场馆模型，提前熟悉座位视角和入口位置',
      color: 'from-neon-purple to-pink-500',
    },
    {
      icon: Calendar,
      title: '一站式服务',
      description: '交通、酒店、美食、景点，一站式解决所有出行需求',
      color: 'from-neon-pink to-orange-500',
    },
    {
      icon: Sparkles,
      title: '氛围体验',
      description: '艺人专属歌单、倒计时提醒，打造沉浸式演唱会氛围',
      color: 'from-orange-500 to-yellow-500',
    },
  ];

  return (
    <div className="min-h-screen pt-16">

      {/* ============================================================ */}
      {/*  全屏启动页 (Splash Screen)                                  */}
      {/* ============================================================ */}
      <SplashScreen onExplore={() => {
        const el = document.getElementById('main-content');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }} />

      {/* ============================================================ */}
      {/*  主页面内容                                                */}
      {/* ============================================================ */}
      <div id="main-content">

      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-start justify-center overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-50" />

        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 w-full">
          {/* 标题 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <span className="inline-flex items-center px-4 py-2 rounded-full bg-neon-blue/10 border border-neon-blue/30 text-neon-blue text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4 mr-2" />
              全国奥体中心演唱会专属助手
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-3">
              <span className="gradient-text">演唱会</span>
              <span className="text-white"> AI 攻略助手</span>
            </h1>
            <p className="text-gray-400 text-base">
              一站式解决交通、酒店、游玩路线，打造专属演唱会氛围体验
            </p>
          </motion.div>

          {/* 对话输入区 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="glass rounded-2xl border border-white/10 mb-10 overflow-hidden"
          >
            {/* 对话区域 */}
            <div className="h-56 overflow-y-auto p-4 space-y-3">
              {orchMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm">
                  <Bot className="w-10 h-10 mb-3 opacity-30" />
                  <p>试试说："我想看周杰伦演唱会，帮我规划行程"</p>
                  <p className="text-xs mt-1 opacity-60">或："推荐一首适合演唱会气氛的歌"</p>
                </div>
              )}
              <AnimatePresence>
                {orchMessages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                      msg.role === 'user'
                        ? 'bg-neon-blue text-white rounded-br-md'
                        : 'glass border border-white/10 text-gray-200 rounded-bl-md'
                    }`}>
                      {msg.content}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* AI 思考步骤 */}
              {orchLoading && (
                <div className="space-y-1.5">
                  {THINK_STEPS.map((step, i) => (
                    <div key={i} className={`flex items-center space-x-2 text-xs px-3 py-1.5 rounded-lg ${
                      i < currentStep ? 'text-green-400 bg-green-500/5'
                        : i === currentStep ? 'text-neon-blue bg-neon-blue/10 border border-neon-blue/20'
                        : 'text-gray-600'
                    }`}>
                      {i < currentStep
                        ? <Check className="w-3 h-3" />
                        : i === currentStep
                        ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                            <Zap className="w-3 h-3" />
                          </motion.div>
                        : <Bot className="w-3 h-3" />
                      }
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* 输入框 */}
            <div className="border-t border-white/10 p-3 flex space-x-2">
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleOrchChat()}
                placeholder="告诉 AI 管家你的需求..."
                className="flex-1 px-4 py-2.5 glass rounded-xl border border-white/10 focus:border-neon-blue/50 focus:outline-none text-white text-sm bg-transparent"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleOrchChat}
                disabled={orchLoading || !chatInput.trim()}
                className="px-4 py-2.5 bg-gradient-to-r from-neon-blue to-neon-purple rounded-xl text-white disabled:opacity-40 flex items-center space-x-1.5"
              >
                {orchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span className="text-sm">发送</span>
              </motion.button>
            </div>
          </motion.div>

          {/* 四大能力 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + index * 0.08 }}
                  whileHover={{ y: -6 }}
                  className="glass rounded-2xl p-4 cursor-pointer card-hover"
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-3`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">{feature.title}</h3>
                  <p className="text-gray-400 text-xs leading-relaxed">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>

          {/* 底部快捷操作 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-4 mt-8"
          >
            <Link
              to="/concerts"
              className="btn-primary flex items-center space-x-2 text-sm px-6 py-3"
            >
              <Music className="w-4 h-4" />
              <span>探索演唱会</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/agent"
              className="btn-secondary flex items-center space-x-2 text-sm px-6 py-3"
            >
              <Sparkles className="w-4 h-4" />
              <span>智能助手</span>
            </Link>
          </motion.div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 rounded-full bg-neon-blue/20 blur-xl animate-float" />
        <div className="absolute bottom-20 right-10 w-32 h-32 rounded-full bg-neon-purple/20 blur-xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/4 w-16 h-16 rounded-full bg-neon-pink/20 blur-xl animate-float" style={{ animationDelay: '4s' }} />
      </section>

      {/* Featured Concerts Section */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center justify-between mb-12"
          >
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                热门演唱会
              </h2>
              <p className="text-gray-400">精选全国热门演出，一键规划行程</p>
            </div>
            <Link
              to="/concerts"
              className="hidden sm:flex items-center space-x-2 text-neon-blue hover:text-neon-purple transition-colors"
            >
              <span>查看全部</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass rounded-2xl h-80 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredConcerts.slice(0, 6).map((concert, index) => (
                <motion.div
                  key={concert.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ConcertCard
                    concert={concert}
                    onClick={() => selectConcert(concert)}
                    isSelected={false}
                  />
                </motion.div>
              ))}
            </div>
          )}

          <div className="mt-8 text-center sm:hidden">
            <Link
              to="/concerts"
              className="btn-secondary inline-flex items-center space-x-2"
            >
              <span>查看全部演唱会</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass rounded-3xl p-8 sm:p-12 text-center border border-neon-blue/30 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-neon-blue/10 to-neon-purple/10" />

            <div className="relative z-10">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-neon-blue to-neon-purple flex items-center justify-center mx-auto mb-6">
                <Star className="w-8 h-8 text-white" />
              </div>

              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                准备好开始你的演唱会之旅了吗？
              </h2>
              <p className="text-gray-400 mb-8 max-w-xl mx-auto">
                选择心仪的演唱会，让 AI 为你规划完美的行程
                从出发到返程，每一个细节都为你考虑周全
              </p>

              <Link
                to="/agent"
                className="btn-primary inline-flex items-center space-x-2 text-lg px-8 py-4"
              >
                <Sparkles className="w-5 h-5" />
                <span>立即开始规划</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
      </div>{/* /#main-content */}
    </div>
  );
};

export default Home;
