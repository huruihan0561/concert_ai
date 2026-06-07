import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Radio, Stars } from 'lucide-react';

const SciFiPanel = ({ icon: Icon = Sparkles, eyebrow, title, description, children, accent = 'cyan' }) => {
  const accentClass = accent === 'purple'
    ? 'from-fuchsia-500/25 to-violet-500/10 border-fuchsia-400/20'
    : accent === 'pink'
      ? 'from-pink-500/25 to-cyan-500/10 border-pink-400/20'
      : 'from-cyan-500/25 to-blue-500/10 border-cyan-400/20';

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-3xl border bg-gradient-to-br ${accentClass} backdrop-blur-xl`}
    >
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.06),transparent_35%,transparent_65%,rgba(255,255,255,0.06))]" />
      <div className="relative p-6 sm:p-7">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 shadow-[0_0_30px_rgba(34,211,238,0.18)]">
            <Icon className="h-5 w-5 text-cyan-200" />
          </div>
          <div>
            {eyebrow && <p className="text-[11px] uppercase tracking-[0.28em] text-white/40">{eyebrow}</p>}
            <h3 className="text-lg font-semibold text-white">{title}</h3>
          </div>
        </div>
        {description && <p className="mb-5 text-sm leading-6 text-white/60">{description}</p>}
        {children}
      </div>
    </motion.div>
  );
};

export default SciFiPanel;
