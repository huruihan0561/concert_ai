import React from 'react';
import { motion } from 'framer-motion';
import { 
  Train, Hotel, Ticket, Utensils, Camera, MapPin, 
  Clock, ArrowRight, Sun, Moon 
} from 'lucide-react';
import { formatDate } from '../utils/helpers';

const PlanTimeline = ({ plan }) => {
  if (!plan) return null;

  const getIcon = (type) => {
    const icons = {
      transport: Train,
      hotel: Hotel,
      concert: Ticket,
      food: Utensils,
      sightseeing: Camera,
      location: MapPin,
    };
    return icons[type] || MapPin;
  };

  const getTypeColor = (type) => {
    const colors = {
      transport: 'from-blue-500 to-cyan-500',
      hotel: 'from-purple-500 to-pink-500',
      concert: 'from-neon-blue to-neon-purple',
      food: 'from-orange-500 to-red-500',
      sightseeing: 'from-green-500 to-emerald-500',
    };
    return colors[type] || 'from-gray-500 to-gray-600';
  };

  const getTypeLabel = (type) => {
    const labels = {
      transport: '交通出行',
      hotel: '住宿安排',
      concert: '演唱会',
      food: '美食推荐',
      sightseeing: '景点游览',
    };
    return labels[type] || '其他';
  };

  // 处理去程交通数据 - 支持 toTransport 数组
  const toTransportList = plan.toTransport || [];
  const backTransportList = plan.backTransport || [];
  
  const timelineItems = [
    // 去程交通
    ...toTransportList.slice(0, 1).map((transport, idx) => ({
      type: 'transport',
      title: `去程 · ${transport.type || '高铁'} ${transport.number || ''}`,
      description: `${transport.fromStation} → ${transport.toStation} · ${transport.duration} · ${transport.price}`,
      time: transport.departureTime,
      details: transport,
    })),
    // 酒店
    ...(plan.hotels?.slice(0, 1).map((hotel, idx) => ({
      type: 'hotel',
      title: hotel.name,
      description: `${hotel.distanceKm || '距离未知'} · ${hotel.priceRange || '价格未知'}`,
      time: '入住',
      details: hotel,
    })) || []),
    // 演唱会
    ...(plan.concert ? [{
      type: 'concert',
      title: `${plan.concert.singer} 演唱会`,
      description: `${plan.concert.venue} · ${plan.concert.ticketPrice || '票价待定'}`,
      time: plan.concert.showTime ? formatDate(plan.concert.showTime, 'HH:mm') : '19:30',
      details: plan.concert,
    }] : []),
    // 返程交通
    ...backTransportList.slice(0, 1).map((transport, idx) => ({
      type: 'transport',
      title: `返程 · ${transport.type || '高铁'} ${transport.number || ''}`,
      description: `${transport.fromStation} → ${transport.toStation} · ${transport.duration} · ${transport.price}`,
      time: transport.departureTime,
      details: transport,
    })),
  ];

  return (
    <div className="relative">
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-neon-blue via-neon-purple to-neon-pink" />
      
      <div className="space-y-6">
        {timelineItems.map((item, index) => {
          const Icon = getIcon(item.type);
          const gradient = getTypeColor(item.type);
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative pl-16"
            >
              <div className={`absolute left-3 w-7 h-7 rounded-full bg-gradient-to-r ${gradient} flex items-center justify-center border-2 border-dark-900`}>
                <Icon className="w-3.5 h-3.5 text-white" />
              </div>
              
              <div className="glass rounded-xl p-4 border border-white/10 hover:border-neon-blue/30 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full bg-gradient-to-r ${gradient} text-white`}>
                      {getTypeLabel(item.type)}
                    </span>
                    <h4 className="text-lg font-bold text-white mt-2">{item.title}</h4>
                  </div>
                  <span className="text-sm text-neon-blue font-medium">{item.time}</span>
                </div>
                
                <p className="text-sm text-gray-400">{item.description}</p>
                
                {item.details?.tips && (
                  <div className="mt-3 p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                    <p className="text-xs text-yellow-400">
                      <span className="font-medium">提示：</span>{item.details.tips}
                    </p>
                  </div>
                )}
                
                {item.type === 'concert' && (
                  <div className="mt-3 flex items-center space-x-4 text-xs text-gray-500">
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      时长约 {item.details.duration} 分钟
                    </span>
                    <span className="flex items-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      {item.details.venue}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {/* 预算预估 - 根据后端实际返回数据调整 */}
      {(plan.toTransport?.length > 0 || plan.hotels?.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 glass rounded-xl p-4 border border-neon-blue/30"
        >
          <h4 className="text-sm font-medium text-gray-300 mb-3">行程概览</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-xs text-gray-500">去程车次</p>
              <p className="text-lg font-bold text-neon-blue">{plan.toTransport?.length || 0} 个选项</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">返程车次</p>
              <p className="text-lg font-bold text-neon-purple">{plan.backTransport?.length || 0} 个选项</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">酒店推荐</p>
              <p className="text-lg font-bold text-neon-pink">{plan.hotels?.length || 0} 家</p>
            </div>
            <div className="text-center border-l border-white/10">
              <p className="text-xs text-gray-500">行程天数</p>
              <p className="text-xl font-bold gradient-text">{plan.dailyItineraries?.length || 1} 天</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default PlanTimeline;
