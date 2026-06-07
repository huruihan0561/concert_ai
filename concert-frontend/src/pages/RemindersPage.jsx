import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, Check, CheckCheck, Trash2, Loader2, Ticket, MapPin, Cloud, Clock, Star, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { reminderApi, concertApi } from '../utils/api';
import { useApp } from '../context/AppContext';

// 提醒类型图标映射
const REMINDER_TYPE_ICONS = {
  TICKET: Ticket,
  TRAVEL: MapPin,
  WEATHER: Cloud,
  COUNTDOWN: Clock,
  PRICE: Star,
};

// 提醒类型颜色映射
const REMINDER_TYPE_COLORS = {
  TICKET: '#f59e0b',
  TRAVEL: '#22d3ee',
  WEATHER: '#3b82f6',
  COUNTDOWN: '#a855f7',
  PRICE: '#ef4444',
};

const RemindersPage = () => {
  const { userId } = useApp();
  const navigate = useNavigate();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [concertsMap, setConcertsMap] = useState({});
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    if (userId) {
      loadReminders();
      loadUnreadCount();
    }
  }, [userId]);

  const loadReminders = async () => {
    setLoading(true);
    try {
      const res = await reminderApi.getList(userId, 50);
      if (res.success && Array.isArray(res.data)) {
        setReminders(res.data);
        // 加载演唱会信息
        loadConcertsInfo(res.data);
      } else {
        setReminders([]);
      }
    } catch (e) {
      console.error('加载提醒失败:', e);
      setReminders([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const res = await reminderApi.getUnreadCount(userId);
      if (res.success) {
        setUnreadCount(res.data || 0);
      }
    } catch (e) {
      console.error('加载未读数量失败:', e);
    }
  };

  const loadConcertsInfo = async (reminders) => {
    const concertIds = [...new Set(reminders.map(r => r.concertId))];
    const map = {};
    for (const id of concertIds) {
      try {
        const res = await concertApi.getConcertById(id);
        if (res.success && res.data) {
          map[id] = res.data;
        }
      } catch (e) {
        console.error('加载演唱会信息失败:', id, e);
      }
    }
    setConcertsMap(map);
  };

  const handleMarkAsRead = async (id) => {
    try {
      await reminderApi.markAsRead(id);
      setReminders(prev => prev.map(r => r.id === id ? { ...r, read: true } : r));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error('标记已读失败:', e);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await reminderApi.markAllAsRead(userId);
      setReminders(prev => prev.map(r => ({ ...r, read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error('标记全部已读失败:', e);
    }
  };

  const handleDelete = async (id) => {
    setRemovingId(id);
    try {
      await reminderApi.delete(id);
      setReminders(prev => prev.filter(r => r.id !== id));
      const reminder = reminders.find(r => r.id === id);
      if (reminder && !reminder.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (e) {
      console.error('删除提醒失败:', e);
    } finally {
      setRemovingId(null);
    }
  };

  const handleConcertClick = (concertId) => {
    navigate(`/concerts/${concertId}`);
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="max-w-2xl mx-auto px-4">

        {/* 头部 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Bell className="w-6 h-6 text-cyan-400" />
                消息提醒
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                共 {reminders.length} 条提醒 · {unreadCount} 条未读
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-cyan-400 border border-cyan-400/30 hover:bg-cyan-400/10 transition-all"
              >
                <CheckCheck className="w-4 h-4" />
                全部已读
              </button>
            )}
          </div>
        </motion.div>

        {/* 提醒列表 */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-7 h-7 animate-spin text-cyan-400" />
          </div>
        ) : reminders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <BellOff className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 text-sm mb-4">暂无提醒消息</p>
            <Link
              to="/concerts"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg,#22d3ee,#a855f7)' }}
            >
              去关注演唱会
              <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {reminders.map((reminder, index) => {
                const Icon = REMINDER_TYPE_ICONS[reminder.reminderType] || Bell;
                const color = REMINDER_TYPE_COLORS[reminder.reminderType] || '#22d3ee';
                const concert = concertsMap[reminder.concertId];

                return (
                  <motion.div
                    key={reminder.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 16 }}
                    transition={{ delay: index * 0.04 }}
                    className={`rounded-xl p-4 transition-all cursor-pointer ${
                      reminder.read ? 'opacity-60' : ''
                    }`}
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: `1px solid ${reminder.read ? 'rgba(255,255,255,0.06)' : `${color}30`}`,
                    }}
                    onClick={() => {
                      if (!reminder.read) handleMarkAsRead(reminder.id);
                      if (reminder.concertId) handleConcertClick(reminder.concertId);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {/* 类型图标 */}
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `${color}20` }}
                      >
                        <Icon className="w-5 h-5" style={{ color }} />
                      </div>

                      {/* 内容 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-semibold text-sm truncate">{reminder.title}</p>
                          {!reminder.read && (
                            <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-gray-400 text-xs line-clamp-2">{reminder.content}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-gray-500 text-xs">{formatTime(reminder.triggerTime)}</span>
                          {concert && (
                            <span className="text-gray-500 text-xs">
                              · {concert.singer} · {concert.city}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 操作按钮 */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!reminder.read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(reminder.id);
                            }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-cyan-400/10 transition-all"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(reminder.id);
                          }}
                          disabled={removingId === reminder.id}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-all"
                        >
                          {removingId === reminder.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default RemindersPage;