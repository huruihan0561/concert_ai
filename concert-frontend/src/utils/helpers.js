import { format, differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export const formatDate = (dateString, formatStr = 'yyyy年MM月dd日 HH:mm') => {
  if (!dateString) return '-';
  try {
    const normalized = dateString.replace(' ', 'T');
    return format(new Date(normalized), formatStr, { locale: zhCN });
  } catch {
    return dateString;
  }
};

export const getCountdown = (targetDate) => {
  if (!targetDate) return null;

  // 统一将 "2026-06-12 19:30:00" 转为 ISO 格式 "2026-06-12T19:30:00"
  const normalized = targetDate.replace(' ', 'T');
  const target = new Date(normalized);
  const now = new Date();

  if (isNaN(target.getTime())) {
    return null;
  }

  if (target < now) {
    return { expired: true, text: '已结束' };
  }

  const days = differenceInDays(target, now);
  const hours = differenceInHours(target, now) % 24;
  const minutes = differenceInMinutes(target, now) % 60;

  return {
    expired: false,
    days,
    hours,
    minutes,
    text: days > 0 ? `${days}天 ${hours}小时` : `${hours}小时 ${minutes}分钟`
  };
};

export const getStatusColor = (status) => {
  const statusMap = {
    '待开售': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
    '预售中': 'bg-green-500/20 text-green-400 border-green-500/50',
    '售票中': 'bg-blue-500/20 text-blue-400 border-blue-500/50',
    '已结束': 'bg-gray-500/20 text-gray-400 border-gray-500/50',
    '即将开始': 'bg-purple-500/20 text-purple-400 border-purple-500/50',
  };
  return statusMap[status] || 'bg-gray-500/20 text-gray-400';
};

export const getStatusText = (status) => {
  return status || '未知';
};

export const formatPrice = (price) => {
  if (!price) return '价格待定';
  return `¥${price}`;
};

export const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

export const cities = [
  { id: 'beijing', name: '北京', venue: '国家体育场（鸟巢）' },
  { id: 'shanghai', name: '上海', venue: '梅赛德斯-奔驰文化中心' },
  { id: 'guangzhou', name: '广州', venue: '广州体育馆' },
  { id: 'shenzhen', name: '深圳', venue: '深圳湾体育中心' },
  { id: 'chengdu', name: '成都', venue: '成都凤凰山体育公园' },
  { id: 'hangzhou', name: '杭州', venue: '杭州奥体中心' },
  { id: 'nanjing', name: '南京', venue: '南京奥体中心' },
  { id: 'wuhan', name: '武汉', venue: '武汉体育中心' },
  { id: 'xian', name: '西安', venue: '西安奥体中心' },
  { id: 'chongqing', name: '重庆', venue: '重庆奥体中心' },
];

export const singers = [
  '周杰伦', '薛之谦', '李荣浩', '毛不易', '邓紫棋', 
  '陈奕迅', '张杰', '周深', '汪苏泷', '林俊杰',
  '五月天', '张学友', '刘德华', '王菲', '李宇春'
];

export const budgetOptions = [
  { value: 'low', label: '经济型', min: 0, max: 1000, desc: '¥0-1000' },
  { value: 'medium', label: '舒适型', min: 1000, max: 3000, desc: '¥1000-3000' },
  { value: 'high', label: '豪华型', min: 3000, max: 5000, desc: '¥3000-5000' },
  { value: 'luxury', label: '奢华型', min: 5000, max: 999999, desc: '¥5000+' },
];

export const preferenceOptions = [
  { value: 'food', label: '美食探索', icon: '🍜', desc: '寻找当地特色美食' },
  { value: 'sightseeing', label: '景点打卡', icon: '📸', desc: '游览热门景点' },
  { value: 'nightlife', label: '夜景体验', icon: '🌃', desc: '欣赏城市夜景' },
  { value: 'shopping', label: '购物逛街', icon: '🛍️', desc: '探索商圈购物' },
  { value: 'culture', label: '文化体验', icon: '🎭', desc: '感受当地文化' },
];
