import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, User, Ticket, Layers } from 'lucide-react';
import { formatDate } from '../utils/helpers';
import { motion } from 'framer-motion';

const ConcertCard = ({ concert, onClick, isSelected, disableClick }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const navigate = useNavigate();

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const statusColors = {
    预售中: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    热售中: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    可预约: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    已结束: 'bg-white/10 text-white/50 border-white/10',
    待定: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  };

  const handleClick = () => {
    if (disableClick) return;
    onClick?.(concert);
    if (!onClick) {
      navigate(`/concerts/${concert.id}`);
    }
  };

  return (
    <motion.div
      whileHover={disableClick ? {} : { y: -4, scale: 1.01 }}
      whileTap={disableClick ? {} : { scale: 0.99 }}
      onClick={handleClick}
      className={`rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer h-full flex flex-col ${
        disableClick ? '' : isSelected
          ? 'ring-2 ring-neon-blue shadow-lg shadow-neon-blue/20'
          : 'hover:shadow-xl hover:shadow-neon-blue/10'
      }`}
      style={{
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(10px)',
        border: isSelected ? '1px solid rgba(0,229,255,0.4)' : '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* 海报区域 - 增加高度，减少遮罩 */}
      <div className="relative overflow-hidden flex-shrink-0" style={{ height: '240px' }}>
        {/* 轻微渐变遮罩，只在最底部 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />

        {concert.imageUrl && !imageError ? (
          <>
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-neon-blue border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <img
              src={concert.imageUrl}
              alt={`${concert.singer}演唱会海报`}
              className={`w-full h-full object-cover transition-all duration-500 hover:scale-105 ${
                imageLoading ? 'opacity-0' : 'opacity-100'
              }`}
              onError={handleImageError}
              onLoad={handleImageLoad}
            />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 flex items-center justify-center">
            <User className="w-16 h-16 text-white/15" />
          </div>
        )}

        {/* 状态标签 */}
        {concert.status && (
          <div className="absolute top-3 right-3 z-20">
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[concert.status] || statusColors['待定']}`}>
              {concert.status}
            </span>
          </div>
        )}

        {/* 连开场次标签 */}
        {concert.showCount > 1 && (
          <div className="absolute top-3 left-3 z-20">
            <span className="inline-flex items-center gap-1 rounded-full border border-fuchsia-300/30 bg-fuchsia-300/15 px-3 py-1 text-xs font-medium text-fuchsia-100">
              <Layers className="h-3.5 w-3.5" />
              连开 {concert.showCount} 场
            </span>
          </div>
        )}

        {/* 歌手信息 - 放在海报底部 */}
        <div className="absolute bottom-0 left-0 right-0 z-20 p-4">
          <h3 className="text-xl font-bold text-white mb-1 drop-shadow-lg">{concert.singer}</h3>
          <p className="text-sm text-white/80 drop-shadow-md">{concert.city} · {concert.venue}</p>
        </div>
      </div>

      {/* 信息区域 */}
      <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
        <div className="flex items-center text-xs text-gray-400">
          <Calendar className="w-3.5 h-3.5 mr-2 text-neon-blue flex-shrink-0" />
          <span>
            {concert.dateRangeLabel
              ? concert.dateRangeLabel
              : formatDate(concert.showTime, 'MM月dd日 HH:mm')}
          </span>
        </div>

        <div className="flex items-center text-xs text-gray-400">
          <MapPin className="w-3.5 h-3.5 mr-2 text-neon-purple flex-shrink-0" />
          <span className="truncate">{concert.venueAddress || concert.venue}</span>
        </div>

        <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center text-xs">
            <Ticket className="w-3.5 h-3.5 mr-2 text-neon-pink flex-shrink-0" />
            <span className="text-neon-blue font-medium">
              {concert.ticketPrice ? `¥${concert.ticketPrice}` : '价格待定'}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ConcertCard;
