import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, User, Filter, X, ChevronDown, Calendar, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ConcertCard from '../components/ConcertCard';
import { concertApi } from '../utils/api';
import { getConcertStatus, groupConcertsBySingerAndVenue } from '../utils/helpers';

const Concerts = ({ onSelectSinger }) => {
  const [concerts, setConcerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedSinger, setSelectedSinger] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [availableCities, setAvailableCities] = useState([]);
  const [availableSingers, setAvailableSingers] = useState([]);
  const navigate = useNavigate();

  const fetchConcerts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: 0, size: 50 };
      if (selectedCity) params.city = selectedCity;
      if (selectedSinger) params.singer = selectedSinger;

      const res = await concertApi.getConcerts(params);
      if (res.success && res.data) {
        const records = Array.isArray(res.data)
          ? res.data
          : res.data.records || [];
        // 按歌手+城市+场馆合并连续场次
        const grouped = groupConcertsBySingerAndVenue(records);
        setConcerts(grouped);
      } else {
        setConcerts([]);
      }
    } catch (e) {
      console.error('加载演唱会列表失败:', e);
      setConcerts([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCity, selectedSinger]);

  const loadFilters = async () => {
    try {
      const [citiesRes, singersRes] = await Promise.all([
        concertApi.getAllCities(),
        concertApi.getAllSingers(),
      ]);
      if (citiesRes.success && Array.isArray(citiesRes.data)) {
        setAvailableCities(citiesRes.data);
      }
      if (singersRes.success && Array.isArray(singersRes.data)) {
        setAvailableSingers(singersRes.data);
      }
    } catch (e) {
      console.error('加载筛选列表失败:', e);
    }
  };

  useEffect(() => {
    loadFilters();
    fetchConcerts();
  }, [fetchConcerts]);

  const filteredConcerts = concerts.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.singer?.toLowerCase().includes(q) ||
      c.city?.toLowerCase().includes(q) ||
      c.venue?.toLowerCase().includes(q)
    );
  });

  const handleConcertClick = (concert) => {
    if (onSelectSinger && concert.singer) {
      onSelectSinger(concert.singer);
    }
    navigate(`/concerts/${concert.id}`);
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
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            探索演唱会
          </h1>
          <p className="text-gray-400 text-sm">
            发现全国热门演唱会，开始你的音乐之旅
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mb-6 flex flex-col sm:flex-row gap-3"
        >
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索艺人、城市或场馆..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl text-sm text-white placeholder-gray-500 outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-5 py-3 rounded-xl text-sm border flex items-center gap-2 transition-all ${
              showFilters
                ? 'bg-neon-blue/20 border-neon-blue/50 text-neon-blue'
                : 'bg-white/05 border-white/10 text-gray-400 hover:text-white'
            }`}
          >
            <Filter className="w-4 h-4" />
            筛选
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </motion.div>

        {/* Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="rounded-xl p-4 space-y-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                {/* City */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" /> 城市
                    </span>
                    {selectedCity && (
                      <button onClick={() => setSelectedCity('')} className="text-xs text-neon-blue hover:text-neon-purple">
                        清除
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availableCities.map((city) => (
                      <button
                        key={city}
                        onClick={() => setSelectedCity(selectedCity === city ? '' : city)}
                        className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                          selectedCity === city
                            ? 'bg-neon-blue/20 text-neon-blue border-neon-blue/50'
                            : 'bg-white/05 text-gray-400 border-white/10 hover:border-white/20 hover:text-white'
                        }`}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Singer */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" /> 歌手
                    </span>
                    {selectedSinger && (
                      <button onClick={() => setSelectedSinger('')} className="text-xs text-neon-blue hover:text-neon-purple">
                        清除
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availableSingers.map((singer) => (
                      <button
                        key={singer}
                        onClick={() => setSelectedSinger(selectedSinger === singer ? '' : singer)}
                        className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                          selectedSinger === singer
                            ? 'bg-neon-purple/20 text-neon-purple border-neon-purple/50'
                            : 'bg-white/05 text-gray-400 border-white/10 hover:border-white/20 hover:text-white'
                        }`}
                      >
                        {singer}
                      </button>
                    ))}
                  </div>
                </div>

                {(selectedCity || selectedSinger) && (
                  <div className="pt-2 border-t border-white/10">
                    <button onClick={clearFilters} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
                      <X className="w-3.5 h-3.5" /> 清除所有筛选
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <div className="mb-4 text-sm text-gray-400">
          找到 <span className="text-neon-blue font-medium">{filteredConcerts.length}</span> 场演唱会
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-neon-blue" />
          </div>
        ) : filteredConcerts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredConcerts.map((concert, index) => (
              <motion.div
                key={concert.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, duration: 0.4 }}
              >
                <ConcertCard
                  concert={{
                    ...concert,
                    status: getConcertStatus(concert.showTime),
                  }}
                  onClick={handleConcertClick}
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
            <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white/60 mb-2">未找到演唱会</h3>
            <p className="text-gray-500 text-sm mb-5">尝试调整筛选条件或搜索关键词</p>
            <button onClick={clearFilters} className="px-5 py-2 rounded-lg bg-neon-blue/10 border border-neon-blue/30 text-neon-blue text-sm hover:bg-neon-blue/20 transition-all">
              清除筛选
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Concerts;
