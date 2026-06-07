import { format, differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds, isSameDay, addDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const parseDate = (dateString) => {
  if (!dateString) return null;
  try {
    const normalized = String(dateString).replace(' ', 'T');
    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  } catch {
    return null;
  }
};

export const formatDate = (dateString, formatStr = 'yyyy年MM月dd日 HH:mm') => {
  if (!dateString) return '-';
  const parsed = parseDate(dateString);
  if (!parsed) return dateString;
  try {
    return format(parsed, formatStr, { locale: zhCN });
  } catch {
    return dateString;
  }
};

export const getCountdown = (targetDate) => {
  const target = parseDate(targetDate);
  if (!target) return null;

  const now = new Date();

  if (target < now) {
    return { expired: true, text: '已结束', clockText: '00:00:00', days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const days = differenceInDays(target, now);
  const hours = differenceInHours(target, now) % 24;
  const minutes = differenceInMinutes(target, now) % 60;
  const seconds = differenceInSeconds(target, now) % 60;
  const clockHours = days > 0 ? days * 24 + hours : hours;

  return {
    expired: false,
    days,
    hours,
    minutes,
    seconds,
    text: days > 0 ? `${days}天 ${hours}小时` : `${hours}小时 ${minutes}分钟`,
    clockText: `${String(clockHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
  };
};

export const getConcertStatus = (showTime) => {
  if (!showTime) return '待定';

  const showDate = parseDate(showTime);
  const now = new Date();

  if (!showDate) return '待定';
  if (showDate < now) return '已结束';

  const diffDays = differenceInDays(showDate, now);
  if (diffDays <= 3) return '即将开演';
  if (diffDays <= 14) return '热售中';
  return '可预约';
};

export const getStatusColor = (status) => {
  const statusMap = {
    可预约: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    热售中: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    即将开演: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40',
    已结束: 'bg-white/10 text-white/50 border-white/10',
    待定: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  };
  return statusMap[status] || statusMap.待定;
};

export const getStatusText = (status) => status || '待定';

export const formatPrice = (price) => {
  if (!price) return '价格待定';
  return String(price).startsWith('¥') ? price : `¥${price}`;
};

export const buildConcertDateRangeLabel = (concerts = []) => {
  const validDates = concerts
    .map((concert) => parseDate(concert.showTime))
    .filter(Boolean)
    .sort((a, b) => a.getTime() - b.getTime());

  if (!validDates.length) return '';
  if (validDates.length === 1) return format(validDates[0], 'MM月dd日', { locale: zhCN });

  // 多个场次，显示日期范围
  const first = validDates[0];
  const last = validDates[validDates.length - 1];

  // 判断是否跨月
  const isSameMonth = first.getMonth() === last.getMonth() && first.getFullYear() === last.getFullYear();

  if (isSameMonth) {
    return `${format(first, 'MM月dd', { locale: zhCN })}-${format(last, 'dd日', { locale: zhCN })}`;
  } else {
    return `${format(first, 'MM月dd', { locale: zhCN })}-${format(last, 'MM月dd日', { locale: zhCN })}`;
  }
};

export const groupConcertsBySingerAndVenue = (concerts = []) => {
  const groups = new Map();

  concerts.forEach((concert) => {
    const key = [concert.singer, concert.city, concert.venue].join('__');
    const current = groups.get(key) || [];
    current.push(concert);
    groups.set(key, current);
  });

  return Array.from(groups.values()).map((items) => {
    const sorted = [...items].sort((a, b) => {
      const aTime = parseDate(a.showTime)?.getTime() || 0;
      const bTime = parseDate(b.showTime)?.getTime() || 0;
      return aTime - bTime;
    });

    const primary = sorted[0];
    const dateRangeLabel = buildConcertDateRangeLabel(sorted);

    return {
      ...primary,
      groupedConcertIds: sorted.map((item) => item.id),
      groupedShows: sorted,
      dateRangeLabel,
      showCount: sorted.length,
    };
  });
};

export const cn = (...classes) => classes.filter(Boolean).join(' ');

export const getStoredSessionId = () => {
  let sessionId = localStorage.getItem('concert_agent_session_id');
  if (!sessionId) {
    sessionId = generateUUID();
    localStorage.setItem('concert_agent_session_id', sessionId);
  }
  return sessionId;
};

export const resetStoredSessionId = () => {
    const nextSessionId = generateUUID();
  localStorage.setItem('concert_agent_session_id', nextSessionId);
  return nextSessionId;
};

export const setStoredSessionId = (id) => {
  localStorage.setItem('concert_agent_session_id', id);
};

export const getStoredUserId = () => {
  let userId = localStorage.getItem('concert_demo_user_id');
  if (!userId) {
    userId = '10001';
    localStorage.setItem('concert_demo_user_id', userId);
  }
  return Number(userId);
};
