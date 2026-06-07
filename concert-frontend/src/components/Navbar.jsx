import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Music, User, Bot, Sparkles, Menu, X, Disc3, Bell } from 'lucide-react';
import { reminderApi } from '../utils/api';
import { useApp } from '../context/AppContext';

const Navbar = () => {
  const location = useLocation();
  const { userId } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (userId) {
      loadUnreadCount();
      // 每30秒刷新未读数量
      const timer = setInterval(loadUnreadCount, 30000);
      return () => clearInterval(timer);
    }
  }, [userId]);

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

  const navItems = [
    { path: '/', label: '首页', icon: Sparkles },
    { path: '/concerts', label: '演唱会', icon: Music },
    { path: '/music', label: '音乐', icon: Disc3 },
    { path: '/agent', label: 'AI助手', icon: Bot },
    { path: '/profile', label: '我的关注', icon: User },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center shadow-lg shadow-neon-blue/30 group-hover:shadow-neon-purple/40 transition-all duration-500">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="absolute inset-0 w-10 h-10 rounded-full border-2 border-neon-blue/40 animate-pulse" />
            </div>
            <span className="text-xl font-bold text-white tracking-wide">
              Concert<span className="text-neon-blue">AI</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    relative flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 group
                    ${isActive ? 'text-white' : 'text-gray-400 hover:text-white'}
                  `}
                >
                  {isActive && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 border border-white/10" />
                  )}
                  <div className={`p-1.5 rounded-lg transition-all duration-300 ${isActive ? 'bg-neon-blue/20 shadow-lg shadow-neon-blue/20' : 'group-hover:bg-white/5'}`}>
                    <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-neon-blue' : ''}`} />
                  </div>
                  <span className="text-sm font-medium relative">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* 提醒入口 */}
          <Link
            to="/reminders"
            className="relative flex items-center justify-center p-2 rounded-xl transition-all duration-300 group hover:bg-white/5"
          >
            <Bell className={`w-5 h-5 transition-colors ${location.pathname === '/reminders' ? 'text-cyan-400' : 'text-gray-400 group-hover:text-white'}`} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

            <div className="ml-4 flex items-center space-x-2 px-3 py-1.5 rounded-full border border-neon-blue/20 bg-neon-blue/5">
              <div className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
              <span className="text-xs text-neon-blue font-medium">AI在线</span>
            </div>

          <button
            className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden pb-4">
            <div className="flex flex-col space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMenuOpen(false)}
                    className={`
                      flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300
                      ${isActive
                        ? 'bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 border border-white/10 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'}
                    `}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-neon-blue' : ''}`} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
