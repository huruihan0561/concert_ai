import React, { useState, useEffect } from 'react';
import { getCountdown } from '../utils/helpers';
import { Clock, Calendar } from 'lucide-react';

const Countdown = ({ targetDate, concertName }) => {
  const [countdown, setCountdown] = useState(getCountdown(targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getCountdown(targetDate));
    }, 60000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!countdown) return null;

  if (countdown.expired) {
    return (
      <div className="glass rounded-2xl p-6 text-center border border-gray-500/30">
        <Clock className="w-12 h-12 text-gray-500 mx-auto mb-3" />
        <p className="text-xl font-bold text-gray-400">{countdown.text}</p>
        <p className="text-sm text-gray-500 mt-1">{concertName}</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6 border border-neon-blue/30">
      <div className="flex items-center justify-center mb-4">
        <Calendar className="w-5 h-5 text-neon-blue mr-2" />
        <span className="text-sm text-gray-400">距离 {concertName} 还有</span>
      </div>
      
      <div className="flex items-center justify-center space-x-4">
        <div className="text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 border border-neon-blue/30 flex items-center justify-center">
            <span className="text-2xl sm:text-3xl font-bold text-white">{countdown.days}</span>
          </div>
          <span className="text-xs text-gray-400 mt-2 block">天</span>
        </div>
        
        <span className="text-2xl font-bold text-neon-blue">:</span>
        
        <div className="text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gradient-to-br from-neon-purple/20 to-neon-pink/20 border border-neon-purple/30 flex items-center justify-center">
            <span className="text-2xl sm:text-3xl font-bold text-white">{countdown.hours}</span>
          </div>
          <span className="text-xs text-gray-400 mt-2 block">小时</span>
        </div>
        
        <span className="text-2xl font-bold text-neon-purple">:</span>
        
        <div className="text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gradient-to-br from-neon-pink/20 to-neon-blue/20 border border-neon-pink/30 flex items-center justify-center">
            <span className="text-2xl sm:text-3xl font-bold text-white">{countdown.minutes}</span>
          </div>
          <span className="text-xs text-gray-400 mt-2 block">分钟</span>
        </div>
      </div>
    </div>
  );
};

export default Countdown;
