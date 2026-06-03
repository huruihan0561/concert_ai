import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Calendar, DollarSign, Heart, Sparkles,
  ArrowRight, Check, Loader2, Train, Hotel, Sun, Moon,
  Cloud, Thermometer, Navigation, Clock, Ticket,
  ChevronDown, ChevronUp, Users, Download, Radio, Brain, Zap, Music, Search
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { concertApi, planningApi, orchestratorApi } from '../utils/api';
import { formatDate } from '../utils/helpers';
import Countdown from '../components/Countdown';

// ============================================================
//  Three.js 粒子背景 (音乐节拍风格)
// ============================================================
const MusicParticleCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let W = (canvas.width = canvas.offsetWidth);
    let H = (canvas.height = canvas.offsetHeight);

    const resize = () => {
      W = canvas.width = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    };
    const onResize = () => resize();
    window.addEventListener('resize', onResize);

    // 粒子参数
    const COLORS = ['#00e5ff', '#a855f7', '#ec4899', '#6366f1', '#22d3ee'];
    const PARTICLE_COUNT = 90;
    const particles = [];

    class Particle {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * W;
        this.y = Math.random() * H;
        this.size = Math.random() * 3 + 1;
        this.speedX = (Math.random() - 0.5) * 0.4;
        this.speedY = -Math.random() * 1.2 - 0.3;
        this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
        this.alpha = Math.random() * 0.5 + 0.15;
        this.pulse = Math.random() * Math.PI * 2;
        this.pulseSpeed = Math.random() * 0.04 + 0.01;
        this.trail = [];
        this.maxTrail = 5;
      }
      update(t) {
        this.pulse += this.pulseSpeed;
        const pulseFactor = Math.sin(this.pulse) * 0.5 + 0.5;
        this.alpha = (pulseFactor * 0.4 + 0.1);

        // 拖尾
        this.trail.unshift({ x: this.x, y: this.y, alpha: this.alpha });
        if (this.trail.length > this.maxTrail) this.trail.pop();

        this.x += this.speedX;
        this.y += this.speedY;

        if (this.y < -10 || this.x < -10 || this.x > W + 10) this.reset();
        this.y = this.y < -10 ? H + 10 : this.y;
      }
      draw() {
        // 拖尾
        for (let i = 0; i < this.trail.length; i++) {
          const t = this.trail[i];
          const trailAlpha = t.alpha * ((this.trail.length - i) / this.trail.length) * 0.4;
          ctx.beginPath();
          ctx.arc(t.x, t.y, this.size * 0.6, 0, Math.PI * 2);
          ctx.fillStyle = this.color + Math.floor(trailAlpha * 255).toString(16).padStart(2, '0');
          ctx.fill();
        }
        // 主体
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
        // 光晕
        const glowSize = this.size * (2 + Math.sin(this.pulse) * 0.8);
        const grd = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glowSize);
        grd.addColorStop(0, this.color + '44');
        grd.addColorStop(1, this.color + '00');
        ctx.beginPath();
        ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.globalAlpha = this.alpha * 0.6;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(new Particle());
    }

    let t = 0;
    const draw = () => {
      t++;
      ctx.clearRect(0, 0, W, H);

      // 底部渐变光
      const bg = ctx.createLinearGradient(0, H * 0.5, 0, H);
      bg.addColorStop(0, 'rgba(0,0,0,0)');
      bg.addColorStop(1, `rgba(99,102,241,${0.06 + Math.sin(t * 0.01) * 0.02})`);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // 顶部渐变光
      const tg = ctx.createRadialGradient(W * 0.3, H * 0.1, 0, W * 0.3, H * 0.1, W * 0.4);
      tg.addColorStop(0, `rgba(0,229,255,${0.04 + Math.sin(t * 0.015) * 0.01})`);
      tg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = tg;
      ctx.fillRect(0, 0, W, H);

      const pg = ctx.createRadialGradient(W * 0.75, H * 0.15, 0, W * 0.75, H * 0.15, W * 0.35);
      pg.addColorStop(0, `rgba(168,85,247,${0.04 + Math.sin(t * 0.012) * 0.01})`);
      pg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = pg;
      ctx.fillRect(0, 0, W, H);

      for (const p of particles) {
        p.update(t);
        p.draw();
      }

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 0,
      }}
    />
  );
};

// ============================================================
//  霓虹分割线
// ============================================================
const NeonDivider = ({ color = 'neon-blue' }) => {
  const colorMap = {
    'neon-blue': '#00e5ff',
    'neon-purple': '#a855f7',
    'neon-pink': '#ec4899',
  };
  const c = colorMap[color] || colorMap['neon-blue'];
  return (
    <div style={{ position: 'relative', height: '1px', margin: '0' }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(90deg, transparent, ${c}40, ${c}, ${c}40, transparent)`,
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(90deg, transparent, ${c}80)`,
        filter: `blur(2px)`,
      }} />
    </div>
  );
};

// ============================================================
//  AI 思考步骤弹窗
// ============================================================
const ThinkingModal = ({ steps, currentStep }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
    }}
  >
    <motion.div
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.85, opacity: 0 }}
      style={{
        background: 'linear-gradient(135deg, rgba(15,15,30,0.95), rgba(25,15,40,0.95))',
        border: '1px solid rgba(168,85,247,0.3)',
        borderRadius: '16px', padding: '24px', width: '320px', maxWidth: '90vw',
        boxShadow: '0 0 40px rgba(168,85,247,0.2), 0 0 80px rgba(0,229,255,0.05)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Brain size={20} color="#00e5ff" />
          <span style={{ fontWeight: 'bold', color: 'white' }}>AI 正在规划中...</span>
        </div>
        <div style={{
          width: '20px', height: '20px', borderRadius: '50%',
          border: '2px solid #00e5ff', borderTopColor: 'transparent',
          animation: 'spin 1s linear infinite',
        }} />
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {steps.map((step, idx) => {
          let bg = 'rgba(30,30,50,0.5)';
          let color = '#555';
          let border = 'none';
          let icon = <Brain size={16} color={color} />;
          if (idx < currentStep) {
            bg = 'rgba(34,197,94,0.1)'; color = '#22c55e';
            border = '1px solid rgba(34,197,94,0.2)';
            icon = <Check size={16} color={color} />;
          } else if (idx === currentStep) {
            bg = 'rgba(0,229,255,0.08)'; color = '#00e5ff';
            border = '1px solid rgba(0,229,255,0.25)';
            icon = (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                <Zap size={16} color={color} />
              </motion.div>
            );
          }
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '8px 12px', borderRadius: '10px',
                background: bg, color, border,
                fontSize: '14px', transition: 'all 0.3s',
              }}
            >
              <span style={{ flexShrink: 0 }}>{icon}</span>
              <span style={{ fontWeight: idx === currentStep ? '600' : '400' }}>{step}</span>
            </motion.div>
          );
        })}
      </div>
      <p style={{ fontSize: '12px', color: '#444', textAlign: 'center', marginTop: '16px' }}>
        请稍候，AI 正在整合信息...
      </p>
    </motion.div>
  </motion.div>
);

// ============================================================
//  步骤指示器
// ============================================================
const StepIndicator = ({ step, total = 3 }) => {
  const labels = ['选择演唱会', '出行偏好', '行程规划'];
  const activeColors = ['#00e5ff', '#a855f7', '#ec4899'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0', marginBottom: '32px' }}>
      {Array.from({ length: total }, (_, i) => i + 1).map((s, idx) => {
        const isActive = step >= s;
        const isCurrent = step === s;
        const color = activeColors[s - 1] || '#00e5ff';
        return (
          <React.Fragment key={s}>
            <motion.div
              animate={isCurrent ? { scale: [1, 1.15, 1] } : {}}
              transition={{ duration: 0.5, repeat: isCurrent ? Infinity : 0, repeatDelay: 1.5 }}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
              }}
            >
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isActive
                  ? `linear-gradient(135deg, ${color}, ${color}88)`
                  : 'rgba(255,255,255,0.05)',
                border: isActive ? 'none' : '1px solid rgba(255,255,255,0.1)',
                boxShadow: isActive ? `0 0 16px ${color}60, 0 0 32px ${color}20` : 'none',
                transition: 'all 0.4s',
              }}>
                {step > s ? (
                  <Check size={16} color="white" />
                ) : (
                  <span style={{ color: isActive ? 'white' : '#555', fontSize: '14px', fontWeight: '600' }}>{s}</span>
                )}
              </div>
              <span style={{
                fontSize: '11px', color: isActive ? color : '#444',
                fontWeight: isActive ? '600' : '400', whiteSpace: 'nowrap',
                transition: 'color 0.3s',
              }}>{labels[s - 1]}</span>
            </motion.div>
            {idx < total - 1 && (
              <div style={{ flex: 1, maxWidth: '80px', height: '2px', margin: '0 8px', marginBottom: '22px', position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.08)', borderRadius: '1px' }} />
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: step > s ? 1 : 0 }}
                  transition={{ duration: 0.5 }}
                  style={{
                    position: 'absolute', inset: 0,
                    background: `linear-gradient(90deg, ${activeColors[s - 1]}, ${activeColors[s] || activeColors[s - 1]})`,
                    borderRadius: '1px',
                    transformOrigin: 'left',
                    boxShadow: `0 0 8px ${activeColors[s - 1]}60`,
                  }}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ============================================================
//  霓虹玻璃卡片
// ============================================================
const NeonCard = ({ children, glowColor = '#00e5ff', style = {}, ...props }) => (
  <motion.div
    whileHover={{ scale: props.noHover ? 1 : 1.01 }}
    style={{
      background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
      backdropFilter: 'blur(20px)',
      border: `1px solid ${glowColor}25`,
      borderRadius: '16px',
      boxShadow: `0 0 20px ${glowColor}08, inset 0 1px 0 rgba(255,255,255,0.06)`,
      transition: 'all 0.3s',
      ...style,
    }}
    {...props}
  >
    {children}
  </motion.div>
);

// ============================================================
//  预算选项
// ============================================================
const budgetOptions = [
  { value: 'low', label: '经济型', desc: '¥0-1000', color: '#22c55e' },
  { value: 'medium', label: '舒适型', desc: '¥1000-3000', color: '#00e5ff' },
  { value: 'high', label: '豪华型', desc: '¥3000-5000', color: '#a855f7' },
  { value: 'luxury', label: '奢华型', desc: '¥5000+', color: '#ec4899' },
];

// 出行方式选项
const transportOptions = [
  { value: 'train', label: '高铁/火车', icon: '🚄', color: '#00e5ff' },
  { value: 'driving', label: '驾车', icon: '🚗', color: '#a855f7' },
  { value: 'transit', label: '公交/地铁', icon: '🚌', color: '#22c55e' },
];

// 游玩偏好选项
const preferenceOptions = [
  { value: '景点打卡', label: '景点打卡', icon: '📸', desc: '游览热门景点', color: '#00e5ff' },
  { value: '美食探店', label: '美食探店', icon: '🍜', desc: '寻找当地特色美食', color: '#f97316' },
  { value: '网红打卡', label: '网红打卡', icon: '📷', desc: '打卡网红地标', color: '#ec4899' },
  { value: '夜景欣赏', label: '夜景欣赏', icon: '🌃', desc: '欣赏城市夜景', color: '#a855f7' },
  { value: '购物血拼', label: '购物血拼', icon: '🛍️', desc: '探索商圈购物', color: '#f43f5e' },
  { value: '自然风光', label: '自然风光', icon: '🌲', desc: '感受自然风光', color: '#22c55e' },
];

// 出发城市选项
const departureCities = [
  { id: 'beijing', name: '北京' }, { id: 'shanghai', name: '上海' },
  { id: 'guangzhou', name: '广州' }, { id: 'shenzhen', name: '深圳' },
  { id: 'chengdu', name: '成都' }, { id: 'hangzhou', name: '杭州' },
  { id: 'nanjing', name: '南京' }, { id: 'wuhan', name: '武汉' },
  { id: 'xian', name: '西安' }, { id: 'chongqing', name: '重庆' },
  { id: 'zhengzhou', name: '郑州' }, { id: 'luoyang', name: '洛阳' },
  { id: 'dalian', name: '大连' }, { id: 'qingdao', name: '青岛' },
  { id: 'tianjin', name: '天津' },
];

// ============================================================
//  主组件
// ============================================================
const Planning = ({ onSelectSinger }) => {
  const { selectedConcert, selectConcert, orchSession } = useApp();
  const [step, setStep] = useState(1);
  const [concerts, setConcerts] = useState([]);
  const [concertSearch, setConcertSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [thinkingSteps, setThinkingSteps] = useState([]);
  const [currentThinkingStep, setCurrentThinkingStep] = useState(-1);
  const thinkingTimerRef = useRef(null);
  const [nearbyFans, setNearbyFans] = useState(null);
  const [showRadio, setShowRadio] = useState(false);
  const [radioData, setRadioData] = useState(null);
  const [generatingRadio, setGeneratingRadio] = useState(false);

  const [formData, setFormData] = useState({
    concertId: '', departureCity: '', departureDate: '', returnDate: '',
    transportType: 'train', budget: 'medium', needPlay: true,
    preference: '景点打卡', tripType: 'overnight',
    specialNeeds: '',
  });

  useEffect(() => { fetchConcerts(); }, []);

  useEffect(() => {
    if (selectedConcert) {
      const showDate = getShowDate(selectedConcert.showTime);
      const today = new Date().toISOString().split('T')[0];
      const defaultTripType = showDate && showDate === today ? 'sameDay' : 'overnight';
      setFormData(prev => ({ ...prev, concertId: selectedConcert.id, departureDate: showDate, returnDate: showDate, tripType: defaultTripType }));
      setStep(2);
      fetchPlaylist(selectedConcert.id);
    }
  }, [selectedConcert]);

  useEffect(() => {
    if (selectedConcert && formData.tripType) {
      const showDate = getShowDate(selectedConcert.showTime);
      if (formData.tripType === 'sameDay') {
        setFormData(prev => ({ ...prev, returnDate: showDate }));
      } else {
        const nextDay = new Date(showDate); nextDay.setDate(nextDay.getDate() + 1);
        setFormData(prev => ({ ...prev, returnDate: nextDay.toISOString().split('T')[0] }));
      }
    }
  }, [formData.tripType, selectedConcert]);

  const getShowDate = (showTime) => {
    if (!showTime) return '';
    return new Date(showTime).toISOString().split('T')[0];
  };

  const fetchConcerts = async () => {
    try {
      const response = await concertApi.getConcerts({ page: 0, size: 20 });
      if (response.success && response.data) setConcerts(response.data.records || []);
    } catch (error) { console.error('Failed to fetch concerts:', error); }
  };

  const fetchPlaylist = async (concertId) => {
    try {
      const concert = concerts.find(c => c.id === parseInt(concertId));
      if (concert?.singer) {
        if (onSelectSinger) onSelectSinger(concert.singer);
        const response = await (await import('../utils/api')).musicApi.getPlaylist(concert.singer);
        if (response.success && response.data) console.log('歌单加载成功:', response.data.songs);
      }
    } catch (error) { console.error('Failed to fetch playlist:', error); }
  };

  const fetchNearbyFans = async () => {
    if (!orchSession) return;
    try {
      const res = await orchestratorApi.getNearbyFans(orchSession);
      if (res.success) setNearbyFans(res.data);
    } catch {}
  };

  const handleGeneratePlan = async () => {
    if (!formData.concertId || !formData.departureCity || !formData.departureDate || !formData.returnDate) {
      alert('请填写完整的行程信息'); return;
    }
    const steps = ['🔍 解析演唱会信息...', '🚆 查询去程交通方案...', '🏨 搜索附近酒店...', '☀️ 获取演唱会日天气...', '🎯 根据偏好推荐景点...', '✨ 生成最终攻略...'];
    setThinkingSteps(steps);
    setCurrentThinkingStep(0);
    setLoading(true);
    thinkingTimerRef.current = setInterval(() => {
      setCurrentThinkingStep(prev => { if (prev < steps.length - 1) return prev + 1; clearInterval(thinkingTimerRef.current); return prev; });
    }, 700);
    try {
      const response = await planningApi.generatePlan({
        concertId: parseInt(formData.concertId), departureCity: formData.departureCity,
        departureDate: formData.departureDate, returnDate: formData.returnDate,
        transportType: formData.transportType, budget: formData.budget,
        needPlay: formData.needPlay, preference: formData.preference, tripType: formData.tripType,
        specialNeeds: formData.specialNeeds,
      });
      if (response.success && response.data) {
        setPlan(response.data);
        setStep(3);
        if (orchSession) {
          try {
            await orchestratorApi.updateSession(orchSession, {
              selectedSinger: response.data.concert?.singer, concertCity: response.data.concert?.city,
              concertDate: response.data.concert?.showTime?.split(' ')[0], departureCity: formData.departureCity,
              budgetLevel: { low: '经济型', medium: '舒适型', high: '豪华型', luxury: '奢华型' }[formData.budget] || '舒适型',
              mood: '期待', preferences: [formData.preference],
              specialNeeds: formData.specialNeeds,
            });
          } catch {}
        }
        fetchNearbyFans();
      }
    } catch (error) {
      console.error('Failed to generate plan:', error);
      alert('生成攻略失败，请稍后重试');
    } finally {
      clearInterval(thinkingTimerRef.current);
      setLoading(false);
      setCurrentThinkingStep(-1);
    }
  };

  const generateConcertRadio = async (mood = 'happy') => {
    if (!orchSession) return;
    setGeneratingRadio(true);
    try {
      const res = await orchestratorApi.createRadio(orchSession, mood);
      if (res.success) { setRadioData(res.data); setShowRadio(true); }
    } catch {}
    setGeneratingRadio(false);
  };

  const isSameCity = () => !!(plan && formData.departureCity && formData.departureCity === plan.concert?.city);

  // ========== 步骤1：选择演唱会 ==========
  const renderStep1 = () => {
    const filtered = concerts.filter(c =>
      !concertSearch ||
      c.singer?.toLowerCase().includes(concertSearch.toLowerCase()) ||
      c.venue?.toLowerCase().includes(concertSearch.toLowerCase()) ||
      c.city?.toLowerCase().includes(concertSearch.toLowerCase())
    );
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} style={{ position: 'relative', zIndex: 1 }}>
        {/* 标题区 */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '6px 16px', borderRadius: '20px',
              background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)',
              marginBottom: '12px',
            }}
          >
            <Music size={14} color="#00e5ff" />
            <span style={{ fontSize: '13px', color: '#00e5ff', fontWeight: '600' }}>演唱会行程规划</span>
          </motion.div>
          <h2 style={{ fontSize: '26px', fontWeight: '800', color: 'white', marginBottom: '8px', letterSpacing: '-0.5px' }}>
            选择你的演唱会之旅
          </h2>
          <p style={{ color: '#666', fontSize: '14px' }}>从下方选择目标演唱会，开启专属行程规划</p>
        </div>

        {/* 搜索框 */}
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <Search size={16} color="#555" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            type="text" value={concertSearch} onChange={e => setConcertSearch(e.target.value)}
            placeholder="搜索歌手、场馆或城市..."
            style={{
              width: '100%', paddingLeft: '40px', paddingRight: '16px', paddingTop: '12px', paddingBottom: '12px',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px', color: 'white', fontSize: '14px', outline: 'none',
              backdropFilter: 'blur(10px)',
              transition: 'border-color 0.3s, box-shadow 0.3s',
            }}
            onFocus={e => { e.target.style.borderColor = 'rgba(0,229,255,0.4)'; e.target.style.boxShadow = '0 0 16px rgba(0,229,255,0.1)'; }}
            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
          />
        </div>

        {/* 演唱会列表 */}
        <div style={{ maxHeight: '58vh', overflowY: 'auto', paddingRight: '4px' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#444' }}>
              <Search size={32} color="#333" style={{ marginBottom: '12px' }} />
              <p>没有找到匹配的演唱会</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filtered.map((concert, idx) => {
                const isSelected = selectedConcert?.id === concert.id;
                const glowColor = isSelected ? '#00e5ff' : 'transparent';
                return (
                  <motion.button
                    key={concert.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ scale: 1.015, x: 4 }}
                    whileTap={{ scale: 0.985 }}
                    onClick={() => selectConcert(concert)}
                    style={{
                      width: '100%', padding: '16px', textAlign: 'left',
                      background: isSelected
                        ? 'linear-gradient(135deg, rgba(0,229,255,0.1), rgba(168,85,247,0.06))'
                        : 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
                      backdropFilter: 'blur(20px)',
                      border: isSelected ? '1px solid rgba(0,229,255,0.35)' : '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '14px', cursor: 'pointer',
                      boxShadow: isSelected ? `0 0 24px rgba(0,229,255,0.15), 0 0 48px rgba(0,229,255,0.05)` : 'none',
                      transition: 'all 0.3s',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                      {/* 封面 */}
                      <div style={{
                        width: '64px', height: '64px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0,
                        background: 'linear-gradient(135deg, rgba(0,229,255,0.15), rgba(168,85,247,0.15))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: isSelected ? '1px solid rgba(0,229,255,0.3)' : 'none',
                      }}>
                        {concert.imageUrl ? (
                          <img src={concert.imageUrl} alt={concert.singer} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <Ticket size={24} color="rgba(255,255,255,0.2)" />
                        )}
                      </div>
                      {/* 信息 */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'white' }}>{concert.singer}</h3>
                          {isSelected && <Check size={14} color="#00e5ff" />}
                        </div>
                        <p style={{ fontSize: '13px', color: '#888', marginBottom: '3px' }}>
                          <MapPin size={11} color="#666" style={{ display: 'inline', marginRight: '3px' }} />
                          {concert.city} · {concert.venue}
                        </p>
                        <p style={{ fontSize: '12px', color: '#00e5ff', marginBottom: '2px' }}>
                          <Calendar size={11} color="#00e5ff" style={{ display: 'inline', marginRight: '3px' }} />
                          {formatDate(concert.showTime)}
                        </p>
                        <p style={{ fontSize: '12px', color: '#a855f7' }}>
                          <span style={{ fontSize: '13px' }}>💰</span> {concert.ticketPrice || '待定'}
                        </p>
                      </div>
                      {/* 箭头 */}
                      <ArrowRight size={18} color={isSelected ? '#00e5ff' : '#333'} style={{ flexShrink: 0, transition: 'color 0.3s' }} />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  // ========== 步骤2：出行偏好 ==========
  const renderStep2 = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} style={{ position: 'relative', zIndex: 1 }}>
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '800', color: 'white', marginBottom: '8px' }}>定制你的行程</h2>
        <p style={{ color: '#666', fontSize: '14px' }}>告诉 AI 你的偏好，生成专属攻略</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* 已选演唱会 */}
        {selectedConcert && (
          <NeonCard glowColor="#00e5ff" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden', background: 'linear-gradient(135deg, rgba(0,229,255,0.2), rgba(168,85,247,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {selectedConcert.imageUrl ? <img src={selectedConcert.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Ticket size={20} color="rgba(255,255,255,0.3)" />}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '11px', color: '#555' }}>已选择演唱会</p>
                <p style={{ fontSize: '15px', fontWeight: '700', color: 'white' }}>{selectedConcert.singer} · {selectedConcert.city}</p>
                <p style={{ fontSize: '12px', color: '#888' }}>{formatDate(selectedConcert.showTime)}</p>
              </div>
              <button onClick={() => { selectConcert(null); setStep(1); }} style={{ background: 'none', border: 'none', color: '#00e5ff', cursor: 'pointer', fontSize: '13px', padding: '4px 8px' }}>更换</button>
            </div>
          </NeonCard>
        )}

        {/* 出发城市 */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: '#aaa', marginBottom: '8px' }}>
            <MapPin size={14} color="#00e5ff" />出发城市
          </label>
          <select
            value={formData.departureCity}
            onChange={e => setFormData(prev => ({ ...prev, departureCity: e.target.value }))}
            style={{
              width: '100%', padding: '12px 16px',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px', color: 'white', fontSize: '14px', outline: 'none',
              backdropFilter: 'blur(10px)',
            }}
          >
            <option value="" style={{ background: '#0f0f1a' }}>请选择出发城市</option>
            {departureCities.map(city => (
              <option key={city.id} value={city.name} style={{ background: '#0f0f1a' }}>{city.name}</option>
            ))}
          </select>
        </div>

        {/* 行程类型 */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: '#aaa', marginBottom: '8px' }}>
            <Calendar size={14} color="#a855f7" />行程类型
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[{ value: 'sameDay', label: '当天往返', desc: '不安排酒店', color: '#00e5ff' }, { value: 'overnight', label: '过夜停留', desc: '推荐酒店住宿', color: '#a855f7' }].map(opt => {
              const isActive = formData.tripType === opt.value;
              return (
                <motion.button
                  key={opt.value}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setFormData(prev => ({ ...prev, tripType: opt.value }))}
                  style={{
                    padding: '14px', borderRadius: '12px', textAlign: 'center', cursor: 'pointer',
                    background: isActive ? `linear-gradient(135deg, ${opt.color}15, ${opt.color}08)` : 'rgba(255,255,255,0.04)',
                    border: isActive ? `1px solid ${opt.color}50` : '1px solid rgba(255,255,255,0.07)',
                    boxShadow: isActive ? `0 0 16px ${opt.color}15` : 'none',
                    transition: 'all 0.3s',
                  }}
                >
                  <p style={{ fontSize: '15px', fontWeight: '600', color: isActive ? opt.color : 'white', marginBottom: '2px' }}>{opt.label}</p>
                  <p style={{ fontSize: '12px', color: '#555' }}>{opt.desc}</p>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* 日期范围 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {[{ key: 'departureDate', label: '出发日期' }, { key: 'returnDate', label: '返程日期' }].map(({ key, label }) => (
            <div key={key}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: '#aaa', marginBottom: '8px' }}>
                <Calendar size={14} color="#22c55e" />{label}
              </label>
              <input
                type="date" value={formData[key]}
                disabled={key === 'returnDate' && formData.tripType === 'sameDay'}
                onChange={e => setFormData(prev => ({ ...prev, [key]: e.target.value }))}
                style={{
                  width: '100%', padding: '10px 12px',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px', color: 'white', fontSize: '13px', outline: 'none',
                  opacity: key === 'returnDate' && formData.tripType === 'sameDay' ? 0.4 : 1,
                  cursor: key === 'returnDate' && formData.tripType === 'sameDay' ? 'not-allowed' : 'default',
                }}
              />
            </div>
          ))}
        </div>

        {/* 出行方式 */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: '#aaa', marginBottom: '8px' }}>
            <Navigation size={14} color="#ec4899" />出行方式
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            {transportOptions.map(opt => {
              const isActive = formData.transportType === opt.value;
              return (
                <motion.button
                  key={opt.value} whileTap={{ scale: 0.95 }}
                  onClick={() => setFormData(prev => ({ ...prev, transportType: opt.value }))}
                  style={{
                    padding: '12px 4px', borderRadius: '10px', textAlign: 'center', cursor: 'pointer',
                    background: isActive ? `${opt.color}12` : 'rgba(255,255,255,0.04)',
                    border: isActive ? `1px solid ${opt.color}50` : '1px solid rgba(255,255,255,0.07)',
                    boxShadow: isActive ? `0 0 12px ${opt.color}15` : 'none',
                    transition: 'all 0.3s',
                  }}
                >
                  <div style={{ fontSize: '20px', marginBottom: '4px' }}>{opt.icon}</div>
                  <p style={{ fontSize: '12px', fontWeight: isActive ? '600' : '400', color: isActive ? opt.color : '#888' }}>{opt.label}</p>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* 预算 */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: '#aaa', marginBottom: '8px' }}>
            <DollarSign size={14} color="#a855f7" />预算范围
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {budgetOptions.map(opt => {
              const isActive = formData.budget === opt.value;
              return (
                <motion.button
                  key={opt.value} whileTap={{ scale: 0.97 }}
                  onClick={() => setFormData(prev => ({ ...prev, budget: opt.value }))}
                  style={{
                    padding: '12px 14px', borderRadius: '10px', textAlign: 'left', cursor: 'pointer',
                    background: isActive ? `${opt.color}12` : 'rgba(255,255,255,0.04)',
                    border: isActive ? `1px solid ${opt.color}50` : '1px solid rgba(255,255,255,0.07)',
                    boxShadow: isActive ? `0 0 12px ${opt.color}15` : 'none',
                    transition: 'all 0.3s',
                  }}
                >
                  <p style={{ fontSize: '14px', fontWeight: '600', color: isActive ? opt.color : 'white', marginBottom: '2px' }}>{opt.label}</p>
                  <p style={{ fontSize: '12px', color: '#555' }}>{opt.desc}</p>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* 游玩开关 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div>
            <p style={{ fontSize: '14px', fontWeight: '600', color: 'white' }}>推荐周边游玩</p>
            <p style={{ fontSize: '12px', color: '#555' }}>AI 推荐演唱会前后的游玩路线</p>
          </div>
          <button
            onClick={() => setFormData(prev => ({ ...prev, needPlay: !prev.needPlay }))}
            style={{
              width: '44px', height: '24px', borderRadius: '12px', position: 'relative',
              background: formData.needPlay ? '#00e5ff' : '#333',
              border: 'none', cursor: 'pointer', transition: 'background 0.3s',
              boxShadow: formData.needPlay ? '0 0 12px rgba(0,229,255,0.4)' : 'none',
            }}
          >
            <div style={{
              width: '18px', height: '18px', borderRadius: '50%', background: 'white',
              position: 'absolute', top: '3px',
              left: formData.needPlay ? '23px' : '3px',
              transition: 'left 0.3s',
              boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
            }} />
          </button>
        </div>

        {/* 游玩偏好 */}
        {formData.needPlay && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0 }} style={{ overflow: 'hidden' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: '#aaa', marginBottom: '8px' }}>
              <Heart size={14} color="#ec4899" />游玩偏好
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {preferenceOptions.map(opt => {
                const isActive = formData.preference === opt.value;
                return (
                  <motion.button
                    key={opt.value} whileTap={{ scale: 0.97 }}
                    onClick={() => setFormData(prev => ({ ...prev, preference: opt.value }))}
                    style={{
                      padding: '12px', borderRadius: '10px', textAlign: 'left', cursor: 'pointer',
                      background: isActive ? `${opt.color}12` : 'rgba(255,255,255,0.04)',
                      border: isActive ? `1px solid ${opt.color}50` : '1px solid rgba(255,255,255,0.07)',
                      boxShadow: isActive ? `0 0 12px ${opt.color}15` : 'none',
                      transition: 'all 0.3s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '16px' }}>{opt.icon}</span>
                      <p style={{ fontSize: '13px', fontWeight: '600', color: isActive ? opt.color : 'white' }}>{opt.label}</p>
                    </div>
                    <p style={{ fontSize: '11px', color: '#555', paddingLeft: '22px' }}>{opt.desc}</p>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* 特殊需求 */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: '#aaa', marginBottom: '8px' }}>
            <Sparkles size={14} color="#f97316" />特殊需求
            <span style={{ fontSize: '11px', color: '#555', fontWeight: '400' }}>(选填)</span>
          </label>
          <textarea
            value={formData.specialNeeds}
            onChange={e => setFormData(prev => ({ ...prev, specialNeeds: e.target.value }))}
            placeholder="例如：需要无障碍通道、带父母一起出行、想吃当地特色美食..."
            rows={3}
            style={{
              width: '100%', padding: '12px 16px',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px', color: 'white', fontSize: '14px', outline: 'none',
              resize: 'vertical', minHeight: '80px', fontFamily: 'inherit', lineHeight: '1.6',
              backdropFilter: 'blur(10px)',
            }}
          />
        </div>

        {/* 生成按钮 */}
        <motion.button
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
          onClick={handleGeneratePlan}
          disabled={loading || !formData.departureCity || !formData.departureDate || !formData.returnDate}
          style={{
            width: '100%', padding: '16px', borderRadius: '14px',
            background: loading || !formData.departureCity || !formData.departureDate || !formData.returnDate
              ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #00e5ff, #a855f7)',
            border: 'none', cursor: loading || !formData.departureCity || !formData.departureDate || !formData.returnDate ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            fontSize: '16px', fontWeight: '700', color: 'white',
            boxShadow: (loading || !formData.departureCity || !formData.departureDate || !formData.returnDate) ? 'none' : '0 0 30px rgba(0,229,255,0.25), 0 0 60px rgba(168,85,247,0.1)',
            transition: 'all 0.3s',
          }}
        >
          {loading ? (
            <>
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                <Sparkles size={18} />
              </motion.div>
              <span>AI 规划中...</span>
            </>
          ) : (
            <>
              <Sparkles size={18} />
              <span>生成专属攻略</span>
            </>
          )}
        </motion.button>
      </div>

      {loading && thinkingSteps.length > 0 && <ThinkingModal steps={thinkingSteps} currentStep={currentThinkingStep} />}
    </motion.div>
  );

  // ========== 步骤3：行程规划结果 ==========
  const renderStep4 = () => {
    if (!plan) return null;
    const sameCity = isSameCity();
    return (
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            style={{
              width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 16px',
              background: 'linear-gradient(135deg, #00e5ff, #a855f7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 32px rgba(0,229,255,0.4), 0 0 64px rgba(168,85,247,0.2)',
            }}
          >
            <Check size={28} color="white" strokeWidth={3} />
          </motion.div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'white', marginBottom: '6px' }}>攻略生成完成！</h2>
          <p style={{ color: '#666', fontSize: '14px' }}>AI 为你定制了专属演唱会行程</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* 演唱会信息 */}
          {plan.concert && (
            <NeonCard glowColor="#00e5ff" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, background: 'linear-gradient(135deg, rgba(0,229,255,0.2), rgba(168,85,247,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0,229,255,0.2)' }}>
                  {plan.concert.imageUrl ? <img src={plan.concert.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Ticket size={28} color="rgba(255,255,255,0.2)" />}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'white', marginBottom: '4px' }}>{plan.concert.singer} 演唱会</h3>
                  <p style={{ fontSize: '13px', color: '#888', marginBottom: '3px' }}>📍 {plan.concert.city} · {plan.concert.venue}</p>
                  <p style={{ fontSize: '13px', color: '#00e5ff', marginBottom: '2px' }}>📅 {plan.concert.showTime} · {plan.concert.weekday}</p>
                  <p style={{ fontSize: '13px', color: '#a855f7' }}>💰 {plan.concert.ticketPrice || '待定'}</p>
                  <p style={{ fontSize: '11px', color: '#444', marginTop: '4px' }}>{plan.concert.venueAddress}</p>
                </div>
              </div>
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <Countdown targetDate={plan.concert.showTime} concertName={`${plan.concert.singer} ${plan.concert.city}演唱会`} />
              </div>
            </NeonCard>
          )}

          {/* 附近粉丝 */}
          {nearbyFans && (
            <NeonCard glowColor="#ec4899" style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Users size={16} color="#ec4899" />
                <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'white' }}>附近粉丝</h4>
              </div>
              <p style={{ fontSize: '13px', color: '#f9a8d4' }}>{nearbyFans.message}</p>
            </NeonCard>
          )}

          {/* 特殊需求适配 */}
          {formData.specialNeeds && (
            <NeonCard glowColor="#f97316" style={{ padding: '14px 16px', border: '1px solid rgba(249,115,22,0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(249,115,22,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Sparkles size={16} color="#f97316" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#f97316' }}>已采纳你的特殊需求</h4>
                    <span style={{ fontSize: '11px', color: '#555', background: 'rgba(249,115,22,0.1)', padding: '2px 8px', borderRadius: '4px' }}>AI 定制</span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#ddd', lineHeight: '1.6' }}>「{formData.specialNeeds}」</p>
                  <p style={{ fontSize: '11px', color: '#555', marginTop: '6px' }}>酒店、行程、交通等环节已围绕此需求进行推荐</p>
                </div>
              </div>
            </NeonCard>
          )}

          {/* 天气 */}
          {plan.weather && (
            <NeonCard style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Cloud size={24} color="#00e5ff" />
                  <div>
                    <p style={{ fontSize: '15px', fontWeight: '600', color: 'white' }}>{plan.weather.city} · {plan.weather.weather}</p>
                    <p style={{ fontSize: '12px', color: '#555' }}>{plan.weather.date}</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Thermometer size={16} color="#f97316" />
                    <span style={{ fontSize: '20px', fontWeight: '800', color: 'white' }}>{plan.weather.temperatureLow}° – {plan.weather.temperatureHigh}°</span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#555', marginTop: '2px' }}>{plan.weather.dressingAdvice}</p>
                </div>
              </div>
            </NeonCard>
          )}

          {/* 交通 */}
          {!sameCity && (
            <>
              {plan.toTransport?.length > 0 && (
                <NeonCard glowColor="#00e5ff" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Train size={16} color="#00e5ff" />
                    <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'white' }}>去程交通</h4>
                    <span style={{ fontSize: '12px', color: '#555' }}>{formData.departureCity} → {plan.concert?.city}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {plan.toTransport.slice(0, 3).map((t, i) => (
                      <div key={i} style={{ padding: '12px', borderRadius: '10px', background: 'rgba(0,229,255,0.05)', border: '1px solid rgba(0,229,255,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '14px', fontWeight: '700', color: 'white' }}>{t.number}</span>
                            <span style={{ fontSize: '11px', color: '#00e5ff', padding: '2px 6px', borderRadius: '4px', background: 'rgba(0,229,255,0.1)' }}>{t.type}</span>
                          </div>
                          <span style={{ fontSize: '14px', fontWeight: '700', color: '#a855f7' }}>{t.price}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '14px', fontWeight: '600', color: 'white' }}>{t.departureTime}</p>
                            <p style={{ fontSize: '11px', color: '#555' }}>{t.fromStation}</p>
                          </div>
                          <div style={{ flex: 1, textAlign: 'center', padding: '0 8px' }}>
                            <p style={{ fontSize: '11px', color: '#444', marginBottom: '2px' }}>{t.duration}</p>
                            <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, #333, transparent)', position: 'relative' }}>
                              <div style={{ position: 'absolute', right: '-4px', top: '-3px', width: '6px', height: '6px', borderRadius: '50%', background: '#555' }} />
                            </div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '14px', fontWeight: '600', color: 'white' }}>{t.arrivalTime}</p>
                            <p style={{ fontSize: '11px', color: '#555' }}>{t.toStation}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </NeonCard>
              )}
              {plan.backTransport?.length > 0 && (
                <NeonCard glowColor="#a855f7" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Train size={16} color="#a855f7" />
                    <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'white' }}>返程交通</h4>
                    <span style={{ fontSize: '12px', color: '#555' }}>{plan.concert?.city} → {formData.departureCity}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {plan.backTransport.slice(0, 3).map((t, i) => (
                      <div key={i} style={{ padding: '12px', borderRadius: '10px', background: 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '14px', fontWeight: '700', color: 'white' }}>{t.number}</span>
                            <span style={{ fontSize: '11px', color: '#a855f7', padding: '2px 6px', borderRadius: '4px', background: 'rgba(168,85,247,0.1)' }}>{t.type}</span>
                          </div>
                          <span style={{ fontSize: '14px', fontWeight: '700', color: '#00e5ff' }}>{t.price}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '14px', fontWeight: '600', color: 'white' }}>{t.departureTime}</p>
                            <p style={{ fontSize: '11px', color: '#555' }}>{t.fromStation}</p>
                          </div>
                          <div style={{ flex: 1, textAlign: 'center', padding: '0 8px' }}>
                            <p style={{ fontSize: '11px', color: '#444', marginBottom: '2px' }}>{t.duration}</p>
                            <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, #333, transparent)', position: 'relative' }}>
                              <div style={{ position: 'absolute', right: '-4px', top: '-3px', width: '6px', height: '6px', borderRadius: '50%', background: '#555' }} />
                            </div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '14px', fontWeight: '600', color: 'white' }}>{t.arrivalTime}</p>
                            <p style={{ fontSize: '11px', color: '#555' }}>{t.toStation}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </NeonCard>
              )}
            </>
          )}
          {sameCity && (
            <NeonCard glowColor="#22c55e" style={{ padding: '14px 16px' }}>
              <p style={{ textAlign: 'center', color: '#22c55e', fontSize: '14px' }}>
                <MapPin size={14} color="#22c55e" style={{ display: 'inline', marginRight: '6px' }} />
                出发城市和演唱会城市相同，无需安排交通
              </p>
            </NeonCard>
          )}

          {/* 酒店 */}
          {formData.tripType === 'overnight' && plan.hotels?.length > 0 && (
            <NeonCard glowColor="#ec4899" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Hotel size={16} color="#ec4899" />
                <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'white' }}>酒店推荐</h4>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {plan.hotels.slice(0, 3).map((h, i) => (
                  <div key={i} style={{ padding: '12px', borderRadius: '10px', background: 'rgba(236,72,153,0.05)', border: '1px solid rgba(236,72,153,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: h.reason ? '8px' : '0' }}>
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: '600', color: 'white', marginBottom: '3px' }}>{h.name}</p>
                        <p style={{ fontSize: '12px', color: '#555' }}>{h.address}</p>
                        <p style={{ fontSize: '11px', color: '#00e5ff', marginTop: '3px' }}>距场馆 {h.distanceKm}</p>
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#ec4899' }}>{h.priceRange}</span>
                    </div>
                    {h.reason && (
                      <div style={{ padding: '8px 10px', borderRadius: '8px', background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.15)' }}>
                        <p style={{ fontSize: '12px', color: '#f97316', lineHeight: '1.5' }}>{h.reason}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </NeonCard>
          )}

          {/* 每日行程 */}
          {plan.dailyItineraries?.length > 0 && (
            <NeonCard glowColor="#a855f7" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <MapPin size={16} color="#a855f7" />
                <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'white' }}>每日行程</h4>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {plan.dailyItineraries.map((day, i) => (
                  <div key={i} style={{ padding: '14px', borderRadius: '12px', background: 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #a855f7, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: 'white', flexShrink: 0 }}>
                        {day.day}
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#a855f7' }}>{day.title}</span>
                    </div>
                    {day.morning?.length > 0 && day.morning.map((a, j) => (
                      <div key={j} style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', color: '#f97316', flexShrink: 0, marginTop: '2px' }}>🌤️</span>
                        <p style={{ fontSize: '13px', color: '#ddd' }}>{a.description}</p>
                      </div>
                    ))}
                    {day.afternoon?.length > 0 && day.afternoon.map((a, j) => (
                      <div key={j} style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', color: '#f59e0b', flexShrink: 0, marginTop: '2px' }}>☀️</span>
                        <p style={{ fontSize: '13px', color: '#ddd' }}>{a.description}</p>
                      </div>
                    ))}
                    {day.evening?.length > 0 && day.evening.map((a, j) => (
                      <div key={j} style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', color: '#6366f1', flexShrink: 0, marginTop: '2px' }}>🌙</span>
                        <p style={{ fontSize: '13px', color: '#ddd' }}>{a.description}</p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </NeonCard>
          )}

        </div>
      </motion.div>
    );
  };

  // ========== 页面主体 ==========
  return (
    <div style={{ minHeight: '100vh', paddingTop: '80px', paddingBottom: '40px', position: 'relative', overflow: 'hidden' }}>
      {/* Three.js 粒子背景 */}
      <MusicParticleCanvas />

      {/* 全局光效 */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, background: 'radial-gradient(ellipse at 50% 0%, rgba(0,229,255,0.03) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(168,85,247,0.04) 0%, transparent 50%)' }} />

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 16px', position: 'relative', zIndex: 1 }}>
        {/* 步骤指示器 */}
        {step < 3 && <StepIndicator step={step} />}

        {/* 主卡片 */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))',
          backdropFilter: 'blur(30px)',
          border: '1.5px solid rgba(255,255,255,0.18)',
          borderRadius: '20px',
          padding: '24px',
          boxShadow: '0 0 60px rgba(0,0,0,0.5), 0 0 80px rgba(0,229,255,0.04), 0 0 160px rgba(168,85,247,0.03), inset 0 1px 0 rgba(255,255,255,0.08)',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* 卡片顶部光效 */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1.5px', background: 'linear-gradient(90deg, transparent, rgba(0,229,255,0.6), rgba(168,85,247,0.6), transparent)', filter: 'blur(0.5px)' }} />

          <AnimatePresence mode="wait">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep4()}
          </AnimatePresence>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.1) transparent; }
        *::-webkit-scrollbar { width: 4px; }
        *::-webkit-scrollbar-track { background: transparent; }
        *::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>
    </div>
  );
};

export default Planning;
