import React, { useState, useEffect } from 'react';

const PHRASES = [
  '正在分析你的需求',
  '正在搜索相关信息',
  '正在规划最佳路线',
  '正在整理推荐方案',
  '正在准备回复',
];

const ICONS = ['🎵', '✨', '🗺️', '🍜', '🏨'];

/**
 * 安慰动画：在流式输出等待期间展示，循环播放多阶段提示
 * @param {number} minSeconds - 最少显示秒数（避免闪烁）
 */
export function ThinkingIndicator({ minSeconds = 3 }) {
  const [phase, setPhase] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), 100);
    const phaseTimer = setInterval(() => {
      setPhase(p => (p + 1) % PHRASES.length);
    }, 1800);
    return () => {
      clearTimeout(showTimer);
      clearInterval(phaseTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="flex gap-4 items-start">
      {/* 头像气泡 */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-base"
        style={{ background: 'linear-gradient(135deg,#00e5ff,#a855f7)' }}
      >
        🎤
      </div>
      <div
        className="px-5 py-3 rounded-2xl rounded-bl-none"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {/* 图标 + 文字 */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base leading-none">{ICONS[phase]}</span>
          <span className="text-white/80 text-sm font-medium">{PHRASES[phase]}</span>
        </div>

        {/* 进度条动画 */}
        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)', width: 140 }}>
          <div
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg,#00e5ff,#a855f7)',
              width: '100%',
              animation: 'thinkingSweep 1.8s ease-in-out infinite',
            }}
          />
        </div>

        {/* 三点波动（辅助） */}
        <div className="flex gap-1 mt-2">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: 'rgba(255,255,255,0.3)',
                animation: `dotWave 1.2s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes thinkingSweep {
          0%   { transform: translateX(-100%); opacity: 0.3; }
          50%  { opacity: 1; }
          100% { transform: translateX(200%); opacity: 0.3; }
        }
        @keyframes dotWave {
          0%, 100% { transform: translateY(0); opacity: 0.3; }
          50%       { transform: translateY(-4px); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
