import React, { useState } from 'react';
import { MapPin, Calendar, User, Ticket } from 'lucide-react';
import { formatDate, getStatusColor, getStatusText } from '../utils/helpers';
import { motion } from 'framer-motion';

const ConcertCard = ({ concert, onClick, isSelected, disableClick }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [aspectRatio, setAspectRatio] = useState(16/9); // 默认宽高比

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = (e) => {
    setImageLoading(false);
    // 根据图片实际尺寸计算宽高比
    const img = e.target;
    if (img.naturalWidth && img.naturalHeight) {
      setAspectRatio(img.naturalWidth / img.naturalHeight);
    }
  };

  // 根据宽高比决定图片区域高度
  const getImageContainerHeight = () => {
    // 限制宽高比在 4:3 到 16:9 之间
    const clampedRatio = Math.max(4/3, Math.min(16/9, aspectRatio));
    // 根据卡片宽度计算高度 (假设卡片宽度约 300-400px)
    const baseWidth = 350;
    return Math.round(baseWidth / clampedRatio);
  };

  return (
    <motion.div
      whileHover={disableClick ? {} : { y: -5, scale: 1.02 }}
      whileTap={disableClick ? {} : { scale: 0.98 }}
      onClick={disableClick ? undefined : () => onClick && onClick(concert)}
      className={`glass rounded-2xl overflow-hidden transition-all duration-300 ${
        disableClick ? '' : 'cursor-pointer ' + (
          isSelected
            ? 'ring-2 ring-neon-blue shadow-lg shadow-neon-blue/20'
            : 'hover:shadow-xl hover:shadow-neon-blue/10'
        )
      }`}
    >
      <div 
        className="relative overflow-hidden"
        style={{ height: `${getImageContainerHeight()}px` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/50 to-transparent z-10" />
        
        {/* 图片显示区域 */}
        {concert.imageUrl && !imageError ? (
          <>
            {imageLoading && (
              <div className="absolute inset-0 bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-neon-blue border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <img
              src={concert.imageUrl}
              alt={`${concert.singer}演唱会海报`}
              className={`w-full h-full object-cover transition-transform duration-500 hover:scale-110 ${
                imageLoading ? 'opacity-0' : 'opacity-100'
              }`}
              onError={handleImageError}
              onLoad={handleImageLoad}
            />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 flex items-center justify-center">
            <User className="w-20 h-20 text-white/20" />
          </div>
        )}

        <div className="absolute top-3 right-3 z-20">
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(concert.status)}`}>
            {getStatusText(concert.status)}
          </span>
        </div>
        <div className="absolute bottom-3 left-3 right-3 z-20">
          <h3 className="text-xl font-bold text-white mb-1">{concert.singer}</h3>
          <p className="text-sm text-gray-300">{concert.city} · {concert.venue}</p>
        </div>
      </div>
      
      <div className="p-4 space-y-3">
        <div className="flex items-center text-sm text-gray-400">
          <Calendar className="w-4 h-4 mr-2 text-neon-blue" />
          <span>{formatDate(concert.showTime)}</span>
        </div>
        
        <div className="flex items-center text-sm text-gray-400">
          <MapPin className="w-4 h-4 mr-2 text-neon-purple" />
          <span className="truncate">{concert.venueAddress || concert.venue}</span>
        </div>
        
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <div className="flex items-center text-sm">
            <Ticket className="w-4 h-4 mr-2 text-neon-pink" />
            <span className="text-neon-blue font-medium">{concert.ticketPrice || '价格待定'}</span>
          </div>
          <span className="text-xs text-gray-500">{concert.showType || '演唱会'}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default ConcertCard;
