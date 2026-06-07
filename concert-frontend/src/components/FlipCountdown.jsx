import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock3 } from 'lucide-react';

const FlipUnit = ({ label, value, accent = 'cyan' }) => {
  const paddedValue = String(value ?? '00').padStart(2, '0');

  const accentMap = {
    cyan: {
      glow: 'rgba(34,211,238,0.18)',
      border: 'rgba(34,211,238,0.26)',
      text: 'text-cyan-100',
      edge: 'from-cyan-300/30 to-cyan-500/10',
      shadow: '0 18px 40px rgba(8,145,178,0.18)',
    },
    fuchsia: {
      glow: 'rgba(168,85,247,0.18)',
      border: 'rgba(192,132,252,0.24)',
      text: 'text-fuchsia-100',
      edge: 'from-fuchsia-300/30 to-fuchsia-500/10',
      shadow: '0 18px 40px rgba(147,51,234,0.18)',
    },
    amber: {
      glow: 'rgba(251,191,36,0.16)',
      border: 'rgba(251,191,36,0.22)',
      text: 'text-amber-50',
      edge: 'from-amber-300/30 to-amber-500/10',
      shadow: '0 18px 40px rgba(217,119,6,0.18)',
    },
    emerald: {
      glow: 'rgba(52,211,153,0.18)',
      border: 'rgba(52,211,153,0.24)',
      text: 'text-emerald-100',
      edge: 'from-emerald-300/30 to-emerald-500/10',
      shadow: '0 18px 40px rgba(16,185,129,0.18)',
    },
  };

  const theme = accentMap[accent] || accentMap.cyan;

  return (
    <div className="min-w-[72px] sm:min-w-[90px] lg:min-w-[100px]">
      <div
        className="relative overflow-hidden rounded-[20px] border bg-[#091120]"
        style={{
          borderColor: theme.border,
          boxShadow: theme.shadow,
          backgroundImage: `linear-gradient(180deg, rgba(15,23,42,0.96), rgba(2,6,23,0.98))`,
        }}
      >
        <div className={`pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b ${theme.edge} opacity-90`} />
        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/10" />
        <div className="pointer-events-none absolute inset-x-3 top-1/2 h-2 -translate-y-1/2 rounded-full bg-black/40 blur-sm" />
        <div className="pointer-events-none absolute left-2 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border border-white/10 bg-[#020617]" />
        <div className="pointer-events-none absolute right-2 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border border-white/10 bg-[#020617]" />

        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={paddedValue}
            initial={{ rotateX: -88, opacity: 0.55, y: -10 }}
            animate={{ rotateX: 0, opacity: 1, y: 0 }}
            exit={{ rotateX: 88, opacity: 0.3, y: 10 }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            className={`relative flex h-[80px] items-center justify-center font-mono text-[36px] font-black tracking-[0.12em] ${theme.text} sm:h-[100px] sm:text-[48px] lg:h-[110px] lg:text-[52px]`}
            style={{ textShadow: `0 0 22px ${theme.glow}` }}
          >
            {paddedValue}
          </motion.div>
        </AnimatePresence>
      </div>
      <p className="mt-2 text-center text-[10px] uppercase tracking-[0.3em] text-white/42">{label}</p>
    </div>
  );
};

const FlipCountdown = ({ countdown }) => {
  if (!countdown || countdown.expired) return null;

  return (
    <div className="rounded-[28px] border border-cyan-300/18 bg-[linear-gradient(180deg,rgba(7,12,28,0.96),rgba(2,6,23,0.98))] p-5 shadow-[0_24px_80px_rgba(8,145,178,0.16)] backdrop-blur-md sm:p-6">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-3 text-cyan-200">
          <Clock3 className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.32em] text-cyan-200/72">Live countdown</p>
          <h3 className="mt-1 text-lg font-semibold text-white">开演倒计时</h3>
        </div>
      </div>

      <div className="mt-5 flex items-start justify-center gap-2 sm:gap-3 lg:gap-4">
        <FlipUnit label="天" value={countdown.days || 0} accent="cyan" />
        <div className="pt-6 text-2xl font-black text-cyan-200/60 sm:pt-8 sm:text-3xl">:</div>
        <FlipUnit label="时" value={countdown.hours || 0} accent="fuchsia" />
        <div className="pt-6 text-2xl font-black text-cyan-200/60 sm:pt-8 sm:text-3xl">:</div>
        <FlipUnit label="分" value={countdown.minutes || 0} accent="amber" />
        <div className="pt-6 text-2xl font-black text-cyan-200/60 sm:pt-8 sm:text-3xl">:</div>
        <FlipUnit label="秒" value={countdown.seconds || 0} accent="emerald" />
      </div>


    </div>
  );
};

export default FlipCountdown;
