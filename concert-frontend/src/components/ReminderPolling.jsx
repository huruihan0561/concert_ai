import React, { useEffect, useRef, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { reminderApi } from '../utils/api';
import { useApp } from '../context/AppContext';

// 浏览器通知权限请求
const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('浏览器不支持通知');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

// 发送浏览器通知
const sendBrowserNotification = (title, body) => {
  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body: body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'concert-reminder',
      requireInteraction: false,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // 3秒后自动关闭
    setTimeout(() => notification.close(), 3000);
  }
};

const ReminderPolling = () => {
  const { userId } = useApp();
  const [reminders, setReminders] = useState([]);
  const [polling, setPolling] = useState(true);
  const [processedIds, setProcessedIds] = useState(new Set());
  const intervalRef = useRef(null);

  // 初始化时请求通知权限
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchReminders = async () => {
      try {
        // 1. 从 Redis 获取即时提醒（关注时立即推送）
        const dueRes = await reminderApi.getDue(userId);
        if (dueRes.success && Array.isArray(dueRes.data) && dueRes.data.length > 0) {
          const freshReminders = dueRes.data
            .filter((msg) => !processedIds.has(msg))
            .map((msg, idx) => ({
              id: `due-${Date.now()}-${idx}`,
              title: '提醒',
              text: msg,
              type: 'INSTANT',
              rawMsg: msg, // 保存原始消息用于去重
            }));

          if (freshReminders.length > 0) {
            setReminders((prev) => [...prev, ...freshReminders]);
            // 标记为已处理
            setProcessedIds((prev) => {
              const newSet = new Set(prev);
              freshReminders.forEach((r) => newSet.add(r.rawMsg));
              return newSet;
            });
            // 发送浏览器通知
            for (const msg of dueRes.data) {
              const parts = msg.split('：');
              const title = parts[0] || '提醒';
              const body = parts[1] || msg;
              sendBrowserNotification(title, body);
            }
          }
        }

        // 2. 从数据库获取未读提醒
        const res = await reminderApi.getList(userId, 10);
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          // 只处理未读提醒
          const unreadReminders = res.data.filter((r) => !r.read && !processedIds.has(r.id));
          if (unreadReminders.length > 0) {
            setReminders((prev) => {
              const existingIds = new Set(prev.map((r) => r.id));
              const fresh = unreadReminders
                .filter((r) => !existingIds.has(r.id))
                .map((r) => ({
                  id: r.id,
                  title: r.title,
                  text: r.content,
                  type: r.reminderType,
                }));
              return [...prev, ...fresh];
            });

            // 标记已处理
            setProcessedIds((prev) => {
              const newSet = new Set(prev);
              unreadReminders.forEach((r) => newSet.add(r.id));
              return newSet;
            });

            // 发送浏览器通知
            for (const reminder of unreadReminders) {
              sendBrowserNotification(reminder.title, reminder.content);
            }

            // 标记为已读
            for (const reminder of unreadReminders) {
              await reminderApi.markAsRead(reminder.id);
            }
          }
        }
      } catch (e) {
        console.error('获取提醒失败:', e);
      }
    };

    const start = () => {
      fetchReminders();
      intervalRef.current = setInterval(fetchReminders, 3000); // 3秒轮询
    };

    const stop = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    if (polling) {
      start();
    }

    return stop;
  }, [userId, polling, processedIds]);

  const dismiss = async (id) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
    // 如果是数据库中的提醒，标记为已读
    if (!id.startsWith('due-')) {
      try {
        await reminderApi.markAsRead(id);
      } catch (e) {
        console.error('标记已读失败:', e);
      }
    }
  };

  return (
    <>
      <div className="fixed top-16 right-4 z-50 flex flex-col gap-2 items-end">
        <AnimatePresence>
          {reminders.map((reminder) => (
            <motion.div
              key={reminder.id}
              initial={{ opacity: 0, x: 80, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.9 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="glass rounded-xl px-4 py-3 max-w-xs flex items-start gap-3 border border-neon-blue/20 shadow-lg"
              style={{ background: 'rgba(0,229,255,0.08)', backdropFilter: 'blur(12px)' }}
            >
              <Bell className="w-5 h-5 text-neon-blue flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-medium text-white mb-0.5">{reminder.title}</div>
                <div className="text-xs text-white/80 leading-relaxed">{reminder.text}</div>
              </div>
              <button
                onClick={() => dismiss(reminder.id)}
                className="text-white/40 hover:text-white flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
};

export default ReminderPolling;
