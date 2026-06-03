import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Music, MapPin, Home, Sparkles, Bot, Menu, X } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'AI助手', icon: Bot },
    { path: '/concerts', label: '演唱会', icon: Music },
    { path: '/venue', label: '场馆预览', icon: MapPin },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      {/* 顶部渐变遮罩 */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center shadow-lg shadow-neon-blue/30 group-hover:shadow-neon-purple/40 transition-all duration-500">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              {/* 呼吸光环 */}
              <div className="absolute inset-0 w-10 h-10 rounded-full border-2 border-neon-blue/40 animate-pulse" />
            </div>
            <span className="text-xl font-bold text-white tracking-wide">
              Concert<span className="text-neon-blue">AI</span>
            </span>
          </Link>

          {/* Desktop Nav */}
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
                    ${isActive
                      ? 'text-white'
                      : 'text-gray-400 hover:text-white'
                    }
                  `}
                >
                  {isActive && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 border border-white/10" />
                  )}
                  <div className={`
                    p-1.5 rounded-lg transition-all duration-300
                    ${isActive ? 'bg-neon-blue/20 shadow-lg shadow-neon-blue/20' : 'group-hover:bg-white/5'}
                  `}>
                    <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-neon-blue' : ''}`} />
                  </div>
                  <span className="text-sm font-medium relative">{item.label}</span>
                </Link>
              );
            })}

            {/* 在线状态指示 */}
            <div className="ml-4 flex items-center space-x-2 px-3 py-1.5 rounded-full border border-neon-blue/20 bg-neon-blue/5">
              <div className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
              <span className="text-xs text-neon-blue font-medium">AI在线</span>
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Nav */}
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
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }
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
