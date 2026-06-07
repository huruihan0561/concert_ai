import React, { useState, useRef, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Float, Text3D, Center } from '@react-three/drei';
import { Music, Calendar, Sparkles, ArrowRight, Star, MessageCircle, Ticket, MapPin } from 'lucide-react';
import * as THREE from 'three';
import ConcertCard from '../components/ConcertCard';
import ParticleBackground from '../components/ParticleBackground';
import { concertApi } from '../utils/api';
import { useApp } from '../context/AppContext';
import AgentChatWindow from '../components/AgentChatWindow';
import { getConcertStatus, groupConcertsBySingerAndVenue, formatDate } from '../utils/helpers';

// 清除所有用户的对话状态
const clearAllConversationStates = () => {
  // 清除所有可能的 current_conversation 键
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('current_conversation_')) {
      localStorage.removeItem(key);
    }
  }
  // 同时清除其他相关状态
  localStorage.removeItem('current_conversation');
};

// 3D 悬浮卡片组件 - 带框架的双面图片
function FloatingCard({ position, color, concert, onClick }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);

  // 加载演唱会海报作为纹理
  const texture = React.useMemo(() => {
    if (concert.imageUrl) {
      const loader = new THREE.TextureLoader();
      const tex = loader.load(concert.imageUrl);
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      return tex;
    }
    return null;
  }, [concert.imageUrl]);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.3) * 0.1;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.getElapsedTime() * 0.5 + position[0]) * 0.1;
    }
  });

  return (
    <group
      ref={meshRef}
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={onClick}
    >
      {/* 外发光环 */}
      <mesh scale={hovered ? 1.1 : 1}>
        <torusGeometry args={[1.2, 0.02, 16, 100]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} />
      </mesh>

      {/* 主卡片背景框架 */}
      <mesh>
        <boxGeometry args={[2, 2.8, 0.1]} />
        <meshStandardMaterial
          color="#0a0a1a"
          roughness={0.2}
          metalness={0.8}
          emissive={color}
          emissiveIntensity={hovered ? 0.2 : 0.05}
        />
      </mesh>

      {/* 海报图片区域 - 正面 */}
      <mesh position={[0, 0.4, 0.06]}>
        <planeGeometry args={[1.8, 1.5]} />
        {texture ? (
          <meshBasicMaterial map={texture} transparent />
        ) : (
          <meshStandardMaterial color={color} roughness={0.4} />
        )}
      </mesh>

      {/* 海报图片区域 - 背面 */}
      <mesh position={[0, 0.4, -0.06]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[1.8, 1.5]} />
        {texture ? (
          <meshBasicMaterial map={texture} transparent />
        ) : (
          <meshStandardMaterial color={color} roughness={0.4} />
        )}
      </mesh>

      {/* 歌手名字背景 - 正面 */}
      <mesh position={[0, -0.6, 0.06]}>
        <planeGeometry args={[1.8, 0.4]} />
        <meshBasicMaterial color="#0a0a1a" transparent opacity={0.9} />
      </mesh>

      {/* 歌手名字背景 - 背面 */}
      <mesh position={[0, -0.6, -0.06]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[1.8, 0.4]} />
        <meshBasicMaterial color="#0a0a1a" transparent opacity={0.9} />
      </mesh>

      {/* 装饰线条 - 正面 */}
      <mesh position={[0, -0.8, 0.06]}>
        <boxGeometry args={[1.6, 0.02, 0.02]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* 装饰线条 - 背面 */}
      <mesh position={[0, -0.8, -0.06]} rotation={[0, Math.PI, 0]}>
        <boxGeometry args={[1.6, 0.02, 0.02]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}

// 固定的专辑封面数据
const featuredAlbums = [
  {
    id: 1,
    singer: '张杰',
    title: '听！我们的歌',
    imageUrl: '/images/zhangjie.jpg',
    color: '#00e5ff',
  },
  {
    id: 2,
    singer: '邓紫棋',
    title: '新的心跳',
    imageUrl: '/images/dengziqi.jpg',
    color: '#a855f7',
  },
  {
    id: 3,
    singer: 'BTS',
    title: 'BTS, THE BEST',
    imageUrl: '/images/bts.jpg',
    color: '#f472b6',
  },
];

// 3D 场景组件
function Scene3D({ onCardClick }) {
  const groupRef = useRef();

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.05) * 0.05;
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#00e5ff" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#a855f7" />

      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      <group ref={groupRef}>
        {featuredAlbums.map((album, index) => (
          <FloatingCard
            key={album.id}
            position={[(index - 1) * 3, 0, 0]}
            color={album.color}
            concert={album}
            onClick={() => onCardClick?.(album)}
          />
        ))}
      </group>

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.5}
        maxPolarAngle={Math.PI / 2}
        minPolarAngle={Math.PI / 2}
      />
    </>
  );
}

const features = [
  {
    icon: Music,
    title: '海量演唱会',
    description: '全国热门演唱会一网打尽，实时更新场次信息',
    color: 'from-cyan-400 to-blue-500',
    glow: 'rgba(34,211,238,0.18)',
  },
  {
    icon: MessageCircle,
    title: 'AI 行程助手',
    description: '周边美食、酒店、打车，美团服务一键直达',
    color: 'from-fuchsia-400 to-pink-500',
    glow: 'rgba(168,85,247,0.18)',
  },
  {
    icon: Calendar,
    title: '关注与提醒',
    description: '关注演唱会，开演前自动收到贴心提醒',
    color: 'from-pink-400 to-orange-400',
    glow: 'rgba(236,72,153,0.18)',
  },
  {
    icon: Star,
    title: '歌手歌单',
    description: '一键播放歌手热门歌曲，提前感受现场氛围',
    color: 'from-amber-400 to-yellow-300',
    glow: 'rgba(245,158,11,0.18)',
  },
];

const Home = ({ onSelectSinger }) => {
  const [featuredConcerts, setFeaturedConcerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const { selectConcert } = useApp();
  const navigate = useNavigate();

  React.useEffect(() => {
    const fetchConcerts = async () => {
      try {
        const res = await concertApi.getConcerts({ page: 0, size: 30 });
        if (res.success && res.data) {
          const records = Array.isArray(res.data)
            ? res.data
            : res.data.records || [];
          const groupedConcerts = groupConcertsBySingerAndVenue(records);
          setFeaturedConcerts(groupedConcerts.slice(0, 7));
        }
      } catch (e) {
        console.error('加载演唱会失败:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchConcerts();
  }, []);

  const handleConcertClick = (concert) => {
    const detailConcert = concert.groupedShows?.[0] || concert;
    selectConcert(detailConcert);
    navigate(`/concerts/${detailConcert.id}`);
  };

  return (
    <div className="min-h-screen pt-20 pb-8">
      {/* 3D 粒子背景 */}
      <ParticleBackground />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Hero Section with 3D */}
        <section className="relative pt-8 pb-14">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* 左侧文字 */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="relative z-10"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full mb-6"
                style={{ background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.3)' }}
              >
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-medium text-cyan-300">AI 智能演唱会助手</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight"
              >
                发现你的
                <span className="block mt-2 bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
                  下一场演唱会
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-lg text-gray-400 mb-8 max-w-lg"
              >
                智能行程规划、座位推荐、抢票提醒，让每一次观演都成为美好回忆
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-wrap gap-4"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/concerts')}
                  className="px-8 py-4 rounded-xl text-sm font-semibold flex items-center gap-2.5 transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #00e5ff, #a855f7)',
                    boxShadow: '0 8px 32px rgba(0,229,255,0.3)',
                    color: 'white',
                  }}
                >
                  <Ticket className="w-4 h-4" />
                  探索演唱会
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    // 清除所有对话状态，确保显示 AI 助手首页（外层页面）
                    clearAllConversationStates();
                    navigate('/agent');
                  }}
                  className="px-8 py-4 rounded-xl text-sm font-semibold flex items-center gap-2.5 transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: 'white',
                  }}
                >
                  <MessageCircle className="w-4 h-4" />
                  问 AI 助手
                </motion.button>
              </motion.div>
            </motion.div>

            {/* 右侧 3D 场景 */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative h-[400px] lg:h-[500px]"
            >
              <Canvas
                camera={{ position: [0, 0, 8], fov: 50 }}
                gl={{ antialias: true, alpha: true }}
                style={{ background: 'transparent' }}
              >
                <Suspense fallback={null}>
                  <Scene3D onCardClick={handleConcertClick} />
                </Suspense>
              </Canvas>
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <section className="mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {features.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={feat.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="rounded-2xl p-5 text-center group cursor-pointer"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                    style={{ background: feat.glow }}
                  >
                    <Icon className="w-6 h-6" style={{ color: feat.color.includes('cyan') ? '#22d3ee' : feat.color.includes('fuchsia') ? '#a855f7' : feat.color.includes('pink') ? '#f472b6' : '#fbbf24' }} />
                  </div>
                  <p className="text-white text-sm font-semibold mb-2">{feat.title}</p>
                  <p className="text-gray-500 text-xs leading-relaxed">{feat.description}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </section>

        {/* Featured Concerts */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center justify-between mb-6"
          >
            <div>
              <h2 className="text-2xl font-bold text-white">热门演唱会</h2>
              <p className="text-gray-500 text-sm mt-1">精选场次，即将开演</p>
            </div>
            <motion.button
              whileHover={{ x: 5 }}
              onClick={() => navigate('/concerts')}
              className="text-sm text-cyan-400 hover:text-fuchsia-400 flex items-center gap-1.5 transition-colors"
            >
              查看全部 <ArrowRight className="w-4 h-4" />
            </motion.button>
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl h-80 animate-pulse"
                  style={{ background: 'rgba(255,255,255,0.05)' }} />
              ))}
            </div>
          ) : featuredConcerts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredConcerts.slice(0, 3).map((concert, index) => (
                <motion.div
                  key={concert.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -8 }}
                >
                  <ConcertCard
                    concert={{
                      ...concert,
                      status: getConcertStatus(concert.showTime),
                    }}
                    onClick={handleConcertClick}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16" style={{ color: 'rgba(255,255,255,0.3)' }}>
              <Music className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>暂无演唱会数据，请确认后端服务已启动</p>
            </div>
          )}
        </section>

        {/* Special Offers Banner */}
        <section className="mt-8 mb-12">
          <div className="grid grid-cols-4 gap-4">
            {[
              { title: '新用户专享', desc: '首单立减15元', tag: '限时', color: 'from-yellow-400 to-orange-500' },
              { title: '酒店特惠', desc: '演唱会周边低至5折', tag: '爆款', color: 'from-purple-400 to-pink-500' },
              { title: '打车福利', desc: '出行立减8元', tag: '热卖', color: 'from-blue-400 to-cyan-500' },
              { title: '美食套餐', desc: '双人套餐立减30', tag: '推荐', color: 'from-green-400 to-emerald-500' },
            ].map((offer, i) => (
              <motion.div
                key={offer.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl p-4 cursor-pointer hover:scale-105 transition-transform"
                style={{ background: `linear-gradient(135deg, ${offer.color})` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white text-sm font-bold">{offer.title}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-white/20 text-white">{offer.tag}</span>
                </div>
                <p className="text-white/80 text-xs">{offer.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

      </div>

      <AgentChatWindow
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        title="演唱会 AI 助手"
      />
    </div>
  );
};

export default Home;
