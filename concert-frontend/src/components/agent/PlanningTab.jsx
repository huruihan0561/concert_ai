import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Calendar, ArrowRight, Sparkles } from 'lucide-react';

const PlanningTab = ({ onSelectSinger }) => {
  const navigate = useNavigate();

  const features = [
    {
      icon: MapPin,
      title: '智能路线规划',
      desc: '根据出发地自动推荐最优交通方案',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Calendar,
      title: '完整行程攻略',
      desc: '演唱会前后游玩路线一键生成',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: Sparkles,
      title: 'AI 全程管家',
      desc: '告诉我想看谁，AI 帮你搞定一切',
      color: 'from-neon-blue to-neon-purple',
    },
  ];

  return (
    <div className="glass rounded-2xl p-8 border border-white/10">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">AI 智能行程规划</h2>
        <p className="text-gray-400">选择演唱会，生成你的专属行程攻略</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-5 glass rounded-xl border border-white/10 hover:border-neon-blue/30 transition-colors"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">{feature.title}</h3>
              <p className="text-gray-400 text-sm">{feature.desc}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="text-center">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/planning')}
          className="btn-primary px-8 py-4 flex items-center space-x-2 mx-auto"
        >
          <span>开始规划行程</span>
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </div>
    </div>
  );
};

export default PlanningTab;
