import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Info,
  Loader,
  Loader2,
  Map,
  MapPin,
  MessageCircle,
  Navigation,
  Sparkles,
  Star,
  Ticket,
} from 'lucide-react';
import { concertApi, musicApi, seatMapApi, userApi, reminderApi } from '../utils/api';
import { formatDate, getConcertStatus, getCountdown, getStatusColor, getStatusText, buildConcertDateRangeLabel, groupConcertsBySingerAndVenue } from '../utils/helpers';
import { useApp } from '../context/AppContext';
import SeatMapStage from '../components/SeatMapStage';
import FlipCountdown from '../components/FlipCountdown';
import AgentChatWindow from '../components/AgentChatWindow';

const DetailPanel = ({ title, eyebrow, children, className = '' }) => (
  <div
    className={`rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(11,15,35,0.94),rgba(6,8,20,0.96))] p-5 shadow-[0_20px_70px_rgba(2,8,23,0.35)] ${className}`}
  >
    {eyebrow && <p className="text-[11px] uppercase tracking-[0.3em] text-cyan-200/70">{eyebrow}</p>}
    {title && <h3 className="mt-2 text-lg font-semibold text-white">{title}</h3>}
    <div className={title || eyebrow ? 'mt-4' : ''}>{children}</div>
  </div>
);

const InfoRow = ({ icon: Icon, iconClassName = '', children }) => (
  <div className="flex items-start gap-3 rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3 text-sm text-white/74">
    <div className="mt-0.5 rounded-xl border border-white/10 bg-white/[0.04] p-2">
      <Icon className={`h-4 w-4 ${iconClassName}`} />
    </div>
    <div className="min-w-0 flex-1">{children}</div>
  </div>
);

const ConcertDetail = ({ onSelectSinger }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userId, setSelectedConcert } = useApp();

  const [concert, setConcert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seatMapConfig, setSeatMapConfig] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followId, setFollowId] = useState(null);
  const [followLoading, setFollowLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatSeed, setChatSeed] = useState('');
  const [playlist, setPlaylist] = useState([]);
  const [countdown, setCountdown] = useState(null);

  useEffect(() => {
    loadConcertDetail();
  }, [id]);

  useEffect(() => {
    if (!concert?.showTime) {
      setCountdown(null);
      return undefined;
    }

    const updateCountdown = () => setCountdown(getCountdown(concert.showTime));
    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, [concert?.showTime]);

  useEffect(() => {
    if (concert?.singer) {
      loadPlaylist(concert.singer);
      onSelectSinger?.(concert.singer, { autoplay: true });
    }
  }, [concert?.singer]);

  const loadPlaylist = async (singer) => {
    try {
      const songs = await musicApi.getArtistSongs(singer);
      setPlaylist(Array.isArray(songs) ? songs : []);
    } catch {
      setPlaylist([]);
    }
  };

  const loadConcertDetail = async () => {
    setLoading(true);
    try {
      const res = await concertApi.getConcertById(id);
      if (res.success && res.data) {
        const concertData = res.data;

        // 获取该歌手在该城市的所有演唱会，计算日期范围
        try {
          const listRes = await concertApi.getConcerts({
            singer: concertData.singer,
            city: concertData.city,
            page: 0,
            size: 50
          });
          if (listRes.success && listRes.data) {
            const records = Array.isArray(listRes.data)
              ? listRes.data
              : listRes.data.records || [];
            // 按歌手+城市+场馆合并
            const grouped = groupConcertsBySingerAndVenue(records);
            // 找到当前演唱会所在的组
            const currentGroup = grouped.find(g =>
              g.singer === concertData.singer &&
              g.city === concertData.city &&
              g.venue === concertData.venue
            );
            if (currentGroup && currentGroup.showCount > 1) {
              concertData.dateRangeLabel = currentGroup.dateRangeLabel;
              concertData.showCount = currentGroup.showCount;
              concertData.groupedShows = currentGroup.groupedShows;
            }
          }
        } catch (e) {
          console.error('加载演唱会列表失败:', e);
        }

        setConcert(concertData);
        // 设置选中的演唱会，用于 AI 助手身份识别
        setSelectedConcert({
          id: concertData.id,
          singer: concertData.singer,
          city: concertData.city,
          venue: concertData.venue,
          showTime: concertData.showTime,
        });
        loadSeatMap(concertData.id);
        checkFollowStatus(concertData.id);
      }
    } catch (e) {
      console.error('加载演唱会详情失败:', e);
    } finally {
      setLoading(false);
    }
  };

  const checkFollowStatus = async (concertId) => {
    try {
      const res = await userApi.checkFollow(userId, concertId);
      if (res.success && res.data) {
        setIsFollowing(true);
        setFollowId(res.data?.id || res.data);
      } else {
        setIsFollowing(false);
        setFollowId(null);
      }
    } catch {
      setIsFollowing(false);
      setFollowId(null);
    }
  };

  const handleFollowToggle = async () => {
    if (!concert) return;
    setFollowLoading(true);
    try {
      if (isFollowing && followId) {
        await userApi.unfollow(followId);
        setIsFollowing(false);
        setFollowId(null);
        // 删除相关提醒（不阻塞）
        reminderApi.deleteConcertReminders(userId, concert.id).catch(console.error);
      } else {
        const res = await userApi.follow(userId, concert.id);
        if (res.success && res.data) {
          setIsFollowing(true);
          setFollowId(res.data?.id || res.data);
          // 创建初始提醒（不阻塞）
          createInitialReminders().catch(console.error);
        }
      }
    } catch (e) {
      console.error('关注操作失败:', e);
    } finally {
      setFollowLoading(false);
    }
  };

  // 关注时创建初始提醒
  const createInitialReminders = async () => {
    if (!concert) return;
    const showTime = new Date(concert.showTime);
    const now = new Date();
    const daysUntilShow = Math.ceil((showTime - now) / (1000 * 60 * 60 * 24));

    // 创建欢迎提醒
    const welcomeReminder = {
      userId: userId,
      concertId: concert.id,
      reminderType: 'COUNTDOWN',
      title: '已关注演唱会',
      content: `您已成功关注【${concert.singer}】演唱会！我们会在开演前提醒您准备行程、查看天气等信息。`,
      triggerTime: new Date().toISOString(),
    };
    await reminderApi.create(welcomeReminder);

    // 如果演唱会即将开演（7天内），创建倒计时提醒
    if (daysUntilShow <= 7 && daysUntilShow > 0) {
      const countdownReminder = {
        userId: userId,
        concertId: concert.id,
        reminderType: 'COUNTDOWN',
        title: `演唱会倒计时${daysUntilShow}天`,
        content: `【${concert.singer}】演唱会将在${daysUntilShow}天后开演！记得提前安排行程哦～`,
        triggerTime: new Date().toISOString(),
      };
      await reminderApi.create(countdownReminder);
    }

    // 如果演唱会即将开演（3天内），创建出行提醒
    if (daysUntilShow <= 3 && daysUntilShow > 0) {
      const travelReminder = {
        userId: userId,
        concertId: concert.id,
        reminderType: 'TRAVEL',
        title: '出行准备提醒',
        content: `【${concert.singer}】演唱会即将开演，建议您现在：\n1. 预订酒店（美团酒店有优惠）\n2. 查看交通路线\n3. 准备演唱会必备物品`,
        triggerTime: new Date().toISOString(),
      };
      await reminderApi.create(travelReminder);
    }
  };

  const loadSeatMap = async (concertId) => {
    try {
      const res = await seatMapApi.getSeatMap(concertId);
      if (res.success && res.data) {
        setSeatMapConfig(res.data);
      } else {
        setSeatMapConfig(null);
      }
    } catch {
      setSeatMapConfig(null);
    }
  };

  const handlePlayPlaylist = () => {
    if (concert?.singer && onSelectSinger) {
      onSelectSinger(concert.singer);
    }
  };

  const openChat = (message = '') => {
    setChatSeed(message);
    setShowChat(true);
  };

  const heroImage = useMemo(
    () => concert?.imageUrl || 'https://picsum.photos/1200/760?random=concert',
    [concert?.imageUrl]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-neon-blue" />
      </div>
    );
  }

  if (!concert) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-white/60">
        <Info className="h-12 w-12 text-white/30" />
        <p>演唱会信息不存在</p>
        <Link to="/concerts" className="rounded-lg bg-neon-blue/20 px-4 py-2 text-sm text-neon-blue">
          返回列表
        </Link>
      </div>
    );
  }

  const status = getConcertStatus(concert.showTime);

  return (
    <div className="min-h-screen bg-[#040511] pb-28 text-white">
      <div className="sticky top-0 z-40 border-b border-white/10 bg-black/70 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <button
              onClick={() => navigate(-1)}
              className="rounded-full p-2 transition-colors hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </button>
            <div className="w-9" />
          </div>
      </div>

      <section className="relative overflow-hidden border-b border-white/8">
        <div className="absolute inset-0">
          <img src={heroImage} alt={concert.singer} className="h-full w-full object-cover opacity-45" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.2),transparent_38%),linear-gradient(180deg,rgba(4,5,17,0.1),rgba(4,5,17,0.86)_60%,#040511_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,5,17,0.92)_0%,rgba(4,5,17,0.45)_45%,rgba(4,5,17,0.86)_100%)]" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-8 lg:pt-14">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(460px,560px)] lg:items-start"
          >
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-cyan-100/90">
                <Sparkles className="h-3.5 w-3.5" />
                Live Event Command Center
              </div>

              <h2 className="mt-4 text-4xl font-black tracking-tight text-white md:text-5xl">
                {concert.singer}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/68 md:text-base">
                {concert.city} · {concert.venue}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => navigate(-1)}
                  className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 text-xs text-white/90 transition hover:bg-white/[0.09]"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  返回上一页
                </button>
                <span className={`rounded-full border px-4 py-2 text-xs ${getStatusColor(status)}`}>
                  {getStatusText(status)}
                </span>
                <button
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs transition-all ${
                    isFollowing
                      ? 'border-red-400/30 bg-red-400/10 text-red-200'
                      : 'border-fuchsia-300/25 bg-fuchsia-300/10 text-fuchsia-100 hover:bg-fuchsia-300/15'
                  }`}
                >
                  {followLoading ? <Loader className="h-3.5 w-3.5 animate-spin" /> : <Star className={`h-3.5 w-3.5 ${isFollowing ? 'fill-current' : ''}`} />}
                  {isFollowing ? '已关注' : '关注演出'}
                </button>
              </div>
            </div>

            <div className="lg:justify-self-end lg:w-full lg:max-w-[560px]">
              <FlipCountdown countdown={countdown} />
            </div>
          </motion.div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.9fr)]">
          <DetailPanel title="演出情报" eyebrow="Performance intel">
            <div className="grid gap-3 md:grid-cols-2">
              <InfoRow icon={Calendar} iconClassName="text-cyan-300">
                <p className="text-xs uppercase tracking-[0.22em] text-white/40">演出时间</p>
                {concert.showCount > 1 && concert.groupedShows ? (
                  <div className="mt-1">
                    <p className="text-sm text-white">
                      {concert.dateRangeLabel} {formatDate(concert.showTime, 'HH:mm')}
                    </p>
                    <p className="text-xs text-white/50 mt-1">共{concert.showCount}场，每日同一时间</p>
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-white">
                    {formatDate(concert.showTime, 'yyyy年MM月dd日 HH:mm')}
                  </p>
                )}
              </InfoRow>
              <InfoRow icon={Clock} iconClassName="text-fuchsia-300">
                <p className="text-xs uppercase tracking-[0.22em] text-white/40">入场时间</p>
                <p className="mt-1 text-sm text-white">{formatDate(concert.doorsOpenTime, 'HH:mm')}</p>
              </InfoRow>
              <InfoRow icon={MapPin} iconClassName="text-pink-300">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs uppercase tracking-[0.22em] text-white/40">场馆地址</p>
                    <p className="mt-1 text-sm text-white leading-relaxed break-all">{concert.venueAddress || concert.venue}</p>
                  </div>
                  <a
                    href={`https://uri.amap.com/search?keyword=${encodeURIComponent(concert.venueAddress || concert.venue)}&city=${encodeURIComponent(concert.city)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 flex items-center gap-1 rounded-lg bg-blue-500/20 px-2 py-1 text-xs text-blue-300 hover:bg-blue-500/30 transition-colors mt-4"
                    title="导航到场馆"
                  >
                    <Navigation className="h-3 w-3" />
                    导航
                  </a>
                </div>
              </InfoRow>
              <InfoRow icon={Ticket} iconClassName="text-emerald-300">
                <p className="text-xs uppercase tracking-[0.22em] text-white/40">票价描述</p>
                <p className="mt-1 text-sm text-white">{concert.ticketPrice ? `票价 ${concert.ticketPrice}` : '票价待定'}</p>
              </InfoRow>
            </div>
          </DetailPanel>

          <DetailPanel title="快速操作" eyebrow="Action panel">
            <div className="space-y-3">
              <button
                onClick={() => openChat(`帮我分析 ${concert.singer} ${concert.showTime ? formatDate(concert.showTime, 'yyyy年MM月dd日 HH:mm') : ''} 在 ${concert.city} ${concert.venue} 演唱会的亮点和值不值得去。`)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-medium text-white transition hover:bg-white/[0.08]"
              >
                <MessageCircle className="h-4 w-4" />
                分析这场演出
              </button>
              <button
                onClick={() => openChat(`帮我规划去 ${concert.city} ${concert.venue} 看 ${concert.singer} ${concert.showTime ? formatDate(concert.showTime, 'yyyy年MM月dd日') : ''} 演唱会的交通和行程。`)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#22d3ee,#8b5cf6)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95"
              >
                <Map className="h-4 w-4" />
                AI 规划攻略
              </button>
            </div>
          </DetailPanel>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mt-8"
        >
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.32em] text-cyan-200/72">Seat map stage</p>
              <h3 className="mt-2 text-2xl font-semibold text-white">2.5D 座位视图</h3>
              <p className="mt-2 text-sm text-white/58">把现有座位图转成带空间层次的舞台视图，更直观看各分区位置和价位层级。</p>
            </div>
          </div>

          <SeatMapStage config={seatMapConfig} onAskAI={openChat} concert={concert} />
        </motion.section>

      </div>

      {showChat && (
        <AgentChatWindow
          isOpen={showChat}
          onClose={() => {
            setShowChat(false);
            setChatSeed('');
          }}
          initialSinger={concert?.singer || ''}
          initialMessage={chatSeed}
        />
      )}
    </div>
  );
};

export default ConcertDetail;
