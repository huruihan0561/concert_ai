import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Info, Eye, Navigation, Clock, Ticket } from 'lucide-react';
import Venue3D from '../components/Venue3D';
import { cities } from '../utils/helpers';

const Venue = () => {
  const [selectedCity, setSelectedCity] = useState(cities[0]);
  const [activeTab, setActiveTab] = useState('3d');

  const venueInfo = {
    facilities: [
      { name: '安检入口', count: '8个', location: '场馆四周' },
      { name: '卫生间', count: '每层12处', location: '看台区附近' },
      { name: '餐饮区', count: '20+', location: '各层通道' },
      { name: '医疗站', count: '3个', location: '主入口、内场、看台' },
      { name: '存包处', count: '4个', location: '各入口旁' },
    ],
    tips: [
      '建议提前2小时到达场馆，预留充足安检时间',
      '禁止携带专业摄影设备、无人机、激光笔等',
      '场馆内设有充电宝租借点，建议自带',
      '结束散场时建议错峰离场，避免拥挤',
      '内场观众请保管好随身物品，注意脚下安全',
    ],
    transport: [
      { type: '地铁', route: '地铁8号线奥体中心站，B出口步行5分钟', time: '末班车 23:30' },
      { type: '公交', route: '快速公交B1线、B3线奥体中心站', time: '末班车 22:00' },
      { type: '自驾', route: '场馆地下停车场，约3000个车位', time: '建议提前3小时到达' },
    ],
  };

  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            场馆 3D 预览
          </h1>
          <p className="text-gray-400">
            沉浸式体验演唱会场馆，提前熟悉座位视角和设施位置
          </p>
        </motion.div>

        {/* City Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-2 overflow-x-auto pb-2">
            <MapPin className="w-5 h-5 text-neon-blue flex-shrink-0" />
            {cities.map((city) => (
              <button
                key={city.id}
                onClick={() => setSelectedCity(city)}
                className={`px-4 py-2 rounded-xl border whitespace-nowrap transition-all ${
                  selectedCity.id === city.id
                    ? 'bg-neon-blue/20 border-neon-blue text-neon-blue'
                    : 'glass border-white/10 text-gray-400 hover:border-white/20'
                }`}
              >
                {city.name}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 3D Viewer */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 glass rounded-2xl overflow-hidden border border-white/10"
            style={{ height: '600px' }}
          >
            <Venue3D venueName={selectedCity.venue} />
          </motion.div>

          {/* Info Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            {/* Venue Header */}
            <div className="glass rounded-2xl p-6 border border-white/10">
              <h2 className="text-xl font-bold text-white mb-2">{selectedCity.venue}</h2>
              <p className="text-sm text-gray-400">{selectedCity.name}</p>
              <div className="mt-4 flex items-center space-x-4 text-sm">
                <span className="text-neon-blue">容纳 60,000 人</span>
                <span className="text-gray-600">|</span>
                <span className="text-neon-purple">3,000 车位</span>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-2">
              {[
                { id: 'facilities', label: '设施', icon: Info },
                { id: 'tips', label: '须知', icon: Eye },
                { id: 'transport', label: '交通', icon: Navigation },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center space-x-1 ${
                      activeTab === tab.id
                        ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/50'
                        : 'glass text-gray-400 border border-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="glass rounded-2xl p-4 border border-white/10 min-h-[300px]">
              {activeTab === 'facilities' && (
                <div className="space-y-3">
                  {venueInfo.facilities.map((facility, index) => (
                    <motion.div
                      key={facility.name}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-white">{facility.name}</p>
                        <p className="text-xs text-gray-500">{facility.location}</p>
                      </div>
                      <span className="text-sm text-neon-blue">{facility.count}</span>
                    </motion.div>
                  ))}
                </div>
              )}

              {activeTab === 'tips' && (
                <div className="space-y-3">
                  {venueInfo.tips.map((tip, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-start space-x-3 p-3 bg-white/5 rounded-lg"
                    >
                      <span className="w-5 h-5 rounded-full bg-neon-blue/20 text-neon-blue flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <p className="text-sm text-gray-300">{tip}</p>
                    </motion.div>
                  ))}
                </div>
              )}

              {activeTab === 'transport' && (
                <div className="space-y-4">
                  {venueInfo.transport.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 bg-white/5 rounded-lg"
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        {item.type === '地铁' && <Navigation className="w-4 h-4 text-neon-blue" />}
                        {item.type === '公交' && <Ticket className="w-4 h-4 text-neon-purple" />}
                        {item.type === '自驾' && <MapPin className="w-4 h-4 text-neon-pink" />}
                        <span className="font-medium text-white">{item.type}</span>
                      </div>
                      <p className="text-sm text-gray-400 mb-1">{item.route}</p>
                      <p className="text-xs text-neon-blue flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {item.time}
                      </p>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Seat View Preview */}
            <div className="glass rounded-2xl p-4 border border-white/10">
              <h3 className="font-medium text-white mb-3 flex items-center">
                <Eye className="w-4 h-4 mr-2 text-neon-blue" />
                视角预览
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {['内场前排', '看台前排', '看台后排'].map((view, index) => (
                  <div key={view} className="aspect-video bg-gradient-to-br from-dark-700 to-dark-800 rounded-lg flex items-center justify-center">
                    <span className="text-xs text-gray-500">{view}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Venue;
