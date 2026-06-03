import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, User, Filter, X, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ConcertCard from '../components/ConcertCard';
import { concertApi } from '../utils/api';
import { useApp } from '../context/AppContext';

const Concerts = ({ onSelectSinger }) => {
  const [concerts, setConcerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedSinger, setSelectedSinger] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [availableCities, setAvailableCities] = useState([]);
  const [availableSingers, setAvailableSingers] = useState([]);
  const { selectConcert, selectedConcert } = useApp();
  const navigate = useNavigate();

  // 加载城市和歌手列表
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [citiesRes, singersRes] = await Promise.all([
          concertApi.getAllCities(),
          concertApi.getAllSingers(),
        ]);
        if (citiesRes.success && citiesRes.data) {
          setAvailableCities(citiesRes.data);
        }
        if (singersRes.success && singersRes.data) {
          setAvailableSingers(singersRes.data);
        }
      } catch (e) {
        console.error('加载筛选列表失败:', e);
      }
    };
    loadFilters();
  }, []);

  useEffect(() => {
    fetchConcerts();
  }, []);

  const fetchConcerts = async () => {
    try {
      setLoading(true);
      const params = { page: 0, size: 50 };
      if (selectedCity) params.city = selectedCity;
      if (selectedSinger) params.singer = selectedSinger;
      
      const response = await concertApi.getConcerts(params);
      
      if (response.success && response.data) {
        const records = response.data.records || response.data;
        setConcerts(records);
      }
    } catch (error) {
      console.error('Failed to fetch concerts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConcerts();
  }, [selectedCity, selectedSinger]);

  const filteredConcerts = concerts.filter(concert => {
    const matchesSearch = !searchQuery || 
      concert.singer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      concert.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      concert.venue?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const handleConcertClick = (concert) => {
    selectConcert(concert);
    // 设置当前歌手，触发音乐播放器加载歌单
    if (onSelectSinger && concert.singer) {
      onSelectSinger(concert.singer);
    }
    navigate('/planning');
  };

  const clearFilters = () => {
    setSelectedCity('');
    setSelectedSinger('');
    setSearchQuery('');
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
            探索演唱会
          </h1>
          <p className="text-gray-400">
            发现全国热门演唱会，选择心仪场次开始规划行程
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 space-y-4"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索艺人、城市或场馆..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 glass rounded-xl border border-white/10 focus:border-neon-blue/50 focus:outline-none text-white placeholder-gray-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-6 py-3 rounded-xl border transition-all flex items-center justify-center space-x-2 ${
                showFilters 
                  ? 'bg-neon-blue/20 border-neon-blue text-neon-blue' 
                  : 'glass border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              <Filter className="w-5 h-5" />
              <span>筛选</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="glass rounded-xl p-4 space-y-4">
                  {/* City Filter */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400 flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        选择城市
                      </span>
                      {selectedCity && (
                        <button
                          onClick={() => setSelectedCity('')}
                          className="text-xs text-neon-blue hover:text-neon-purple"
                        >
                          清除
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {availableCities.map((city) => (
                        <button
                          key={city}
                          onClick={() => setSelectedCity(selectedCity === city ? '' : city)}
                          className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                            selectedCity === city
                              ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/50'
                              : 'bg-white/5 text-gray-400 border border-white/10 hover:border-white/20'
                          }`}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Singer Filter */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400 flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        选择艺人
                      </span>
                      {selectedSinger && (
                        <button
                          onClick={() => setSelectedSinger('')}
                          className="text-xs text-neon-blue hover:text-neon-purple"
                        >
                          清除
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {availableSingers.map((singer) => (
                        <button
                          key={singer}
                          onClick={() => setSelectedSinger(selectedSinger === singer ? '' : singer)}
                          className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                            selectedSinger === singer
                              ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/50'
                              : 'bg-white/5 text-gray-400 border border-white/10 hover:border-white/20'
                          }`}
                        >
                          {singer}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Clear All */}
                  {(selectedCity || selectedSinger || searchQuery) && (
                    <div className="pt-2 border-t border-white/10">
                      <button
                        onClick={clearFilters}
                        className="flex items-center space-x-1 text-sm text-gray-400 hover:text-white transition-colors"
                      >
                        <X className="w-4 h-4" />
                        <span>清除所有筛选</span>
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Results Count */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6 flex items-center justify-between"
        >
          <span className="text-gray-400">
            找到 <span className="text-neon-blue font-medium">{filteredConcerts.length}</span> 场演唱会
          </span>
        </motion.div>

        {/* Concerts Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="glass rounded-2xl h-80 animate-pulse" />
            ))}
          </div>
        ) : filteredConcerts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredConcerts.map((concert, index) => (
              <motion.div
                key={concert.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <ConcertCard
                  concert={concert}
                  onClick={handleConcertClick}
                  isSelected={selectedConcert?.id === concert.id}
                  disableClick
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-gray-500" />
            </div>
            <h3 className="text-xl font-medium text-white mb-2">未找到演唱会</h3>
            <p className="text-gray-400 mb-6">尝试调整筛选条件或搜索关键词</p>
            <button
              onClick={clearFilters}
              className="btn-secondary"
            >
              清除筛选
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Concerts;
