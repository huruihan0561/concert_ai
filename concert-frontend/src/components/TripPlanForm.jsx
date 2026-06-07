import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Calendar, Train, Plane, Car, Mountain, Building, ShoppingBag, Shirt, Sparkles, X, ArrowRight, ChevronLeft, Search, Loader2 } from 'lucide-react';
import { concertApi } from '../utils/api';

const PREFERENCE_OPTIONS = [
  { icon: Mountain, label: '自然风光', value: 'nature' },
  { icon: Building, label: '历史文化', value: 'history' },
  { icon: ShoppingBag, label: '逛街购物', value: 'shopping' },
  { icon: Shirt, label: '网红打卡', value: 'trendy' },
];

const TripPlanForm = ({ concert, onSubmit, onCancel, onBack, onClearConcert }) => {
  const [formData, setFormData] = useState({
    // 演唱会信息（预填）
    singer: concert?.singer || '',
    city: concert?.city || '',
    venue: concert?.venue || '',
    concertDate: concert?.showTime ? formatDate(concert.showTime) : '',
    concertTime: concert?.showTime ? formatTime(concert.showTime) : '',
    // 用户输入
    departureCity: '',
    departureDate: '',
    returnDate: '',
    preferences: [],
    budget: 'medium',
    notes: '',
    needRide: false,
    needFood: false,
    needHotel: false,
    wantTour: false, // 是否游玩
  });

  // 演唱会搜索状态
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchTimerRef = useRef(null);

  // 同步外部 concert prop 变化到 formData
  useEffect(() => {
    if (concert) {
      setFormData(prev => ({
        ...prev,
        singer: concert.singer || '',
        city: concert.city || '',
        venue: concert.venue || '',
        concertDate: concert.showTime ? formatDate(concert.showTime) : '',
        concertTime: concert.showTime ? formatTime(concert.showTime) : '',
      }));
    }
  }, [concert]);

  // 搜索演唱会
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const res = await concertApi.getConcerts({ singer: searchQuery, page: 0, size: 20 });
        if (res.success && res.data) {
          const records = Array.isArray(res.data) ? res.data : res.data.records || [];
          setSearchResults(records);
        } else {
          setSearchResults([]);
        }
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(searchTimerRef.current);
  }, [searchQuery]);

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function formatTime(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  const update = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const togglePreference = (value) => {
    setFormData(prev => ({
      ...prev,
      preferences: prev.preferences.includes(value)
        ? prev.preferences.filter(p => p !== value)
        : [...prev.preferences, value],
    }));
  };

  const handleSubmit = () => {
    // 构造一个结构化的行程规划请求，发送给 AI
    const requestText = buildRequestText(formData);
    onSubmit(requestText);
  };

  const isValid = formData.departureCity.trim() && formData.departureDate;

  return (
    <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {onBack && (
            <button onClick={onBack} className="text-white/40 hover:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-neon-blue" />
            行程规划助手
          </h3>
        </div>
        <button onClick={onCancel} className="text-white/30 hover:text-white/60 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 演唱会信息卡片 */}
      {formData.singer ? (
        <div className="rounded-xl p-3 mb-4 relative" style={{ background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.15)' }}>
          <div className="flex justify-between items-start mb-1">
            <p className="text-xs text-neon-blue">演唱会信息</p>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                update('singer', '');
                update('city', '');
                update('venue', '');
                update('concertDate', '');
                update('concertTime', '');
                if (onClearConcert) onClearConcert();
              }}
              className="text-white/40 hover:text-white/70 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-white font-medium text-sm">{formData.singer}</p>
          <p className="text-white/50 text-xs mt-0.5">
            {formData.concertDate} {formData.concertTime} · {formData.city} {formData.venue}
          </p>
        </div>
      ) : (
        <div className="rounded-xl p-3 mb-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)' }}>
          <p className="text-white/50 text-xs mb-2 text-center">选择演唱会（选填）</p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜索歌手、场馆或城市..."
              className="w-full pl-8 pr-3 py-2 rounded-lg text-xs text-white bg-white/5 border border-white/10 placeholder-white/20 outline-none focus:border-neon-blue/50 transition-colors"
            />
            {searching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 animate-spin" />
            )}
          </div>
          {searchResults.length > 0 && (
            <div className="mt-2 rounded-lg overflow-hidden border border-white/10">
              {searchResults.slice(0, 5).map(c => (
                <button
                  key={c.id}
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      singer: c.singer,
                      city: c.city,
                      venue: c.venue,
                      concertDate: formatDate(c.showTime),
                      concertTime: formatTime(c.showTime),
                    }));
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-white/10 border-b border-white/5 transition-colors"
                >
                  <p className="text-white/80 font-medium">{c.singer}</p>
                  <p className="text-white/40 mt-0.5">{formatDate(c.showTime)} {c.city} {c.venue}</p>
                </button>
              ))}
            </div>
          )}
          {searchQuery && !searching && searchResults.length === 0 && (
            <p className="text-white/30 text-[11px] text-center mt-2">未找到相关演唱会</p>
          )}
        </div>
      )}

      <div className="space-y-3">
        {/* 出发城市 */}
        <div>
          <label className="text-white/60 text-xs mb-1 block">出发城市 *</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              value={formData.departureCity}
              onChange={e => update('departureCity', e.target.value)}
              placeholder="例如：北京、上海、广州"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white bg-white/5 border border-white/10 placeholder-white/20 outline-none focus:border-neon-blue/50 transition-colors"
            />
          </div>
        </div>

        {/* 出发日期和返程日期 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-white/60 text-xs mb-1 block">出发日期 *</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="date"
                value={formData.departureDate}
                onChange={e => update('departureDate', e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white bg-white/5 border border-white/10 outline-none focus:border-neon-blue/50 transition-colors"
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </div>
          <div>
            <label className="text-white/60 text-xs mb-1 block">返程日期</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="date"
                value={formData.returnDate}
                onChange={e => update('returnDate', e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white bg-white/5 border border-white/10 outline-none focus:border-neon-blue/50 transition-colors"
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </div>
        </div>

        {/* 是否游玩 */}
        <div>
          <label className="text-white/60 text-xs mb-1.5 block">是否游玩</label>
          <div className="flex gap-2">
            <button
              onClick={() => update('wantTour', true)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                formData.wantTour
                  ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/40'
                  : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
              }`}
            >
              是，想顺便游玩
            </button>
            <button
              onClick={() => {
                update('wantTour', false);
                update('preferences', []); // 清空偏好
              }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                !formData.wantTour
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
              }`}
            >
              否，只看演唱会
            </button>
          </div>
        </div>

        {/* 游玩偏好 - 只有选择游玩才显示 */}
        {formData.wantTour && (
          <div>
            <label className="text-white/60 text-xs mb-1.5 block">游玩偏好（可多选）</label>
            <div className="grid grid-cols-2 gap-2">
              {PREFERENCE_OPTIONS.map(opt => {
                const Icon = opt.icon;
                const selected = formData.preferences.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() => togglePreference(opt.value)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${
                      selected
                        ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/40'
                        : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 预算 */}
        <div>
          <label className="text-white/60 text-xs mb-1.5 block">预算范围</label>
          <div className="flex gap-2">
            {[
              { value: 'low', label: '经济', color: '#22c55e' },
              { value: 'medium', label: '适中', color: '#f59e0b' },
              { value: 'high', label: '宽裕', color: '#a855f7' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => update('budget', opt.value)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  formData.budget === opt.value
                    ? 'text-white border'
                    : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
                }`}
                style={formData.budget === opt.value ? { background: `${opt.color}20`, borderColor: `${opt.color}50` } : {}}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 附加服务 */}
        <div>
          <label className="text-white/60 text-xs mb-1.5 block">需要我帮你安排</label>
          <div className="flex gap-2 flex-wrap">
            {[
              { value: 'needHotel', label: '酒店住宿' },
              { value: 'needFood', label: '餐饮美食' },
              { value: 'needRide', label: '交通出行' },
            ].map(opt => {
              const checked = formData[opt.value];
              return (
                <button
                  key={opt.value}
                  onClick={() => update(opt.value, !checked)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
                    checked
                      ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/40'
                      : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 备注 */}
        <div>
          <label className="text-white/60 text-xs mb-1 block">其他要求（选填）</label>
          <textarea
            value={formData.notes}
            onChange={e => update('notes', e.target.value)}
            placeholder="例如：想带孩子一起、想顺路去某地、有老人同行..."
            rows={2}
            className="w-full px-4 py-2.5 rounded-xl text-sm text-white bg-white/5 border border-white/10 placeholder-white/20 outline-none focus:border-neon-blue/50 transition-colors resize-none"
          />
        </div>

        {/* 提交按钮 */}
        <button
          onClick={handleSubmit}
          disabled={!isValid}
          className={`w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
            isValid
              ? 'bg-gradient-to-r from-neon-blue to-neon-purple text-white'
              : 'bg-white/5 text-white/30 cursor-not-allowed'
          }`}
        >
          生成行程规划 <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

function buildRequestText(form) {
  const dayCount = form.departureDate && form.returnDate
    ? `${countDays(form.departureDate, form.returnDate)}天`
    : '待定';

  const prefText = form.wantTour && form.preferences.length > 0
    ? `偏好：${form.preferences.map(p => ({
        nature: '自然风光', history: '历史文化', shopping: '逛街购物', trendy: '网红打卡'
      }[p] || p)).join('、')}`
    : '';

  const serviceText = [
    form.needHotel && '酒店住宿',
    form.needFood && '餐饮美食',
    form.needRide && '交通出行',
  ].filter(Boolean).join('、');

  const parts = [
    form.singer && `歌手：${form.singer}`,
    form.city && `城市：${form.city}`,
    form.venue && `场馆：${form.venue}`,
    form.concertDate && `演唱会日期：${form.concertDate}`,
    form.concertTime && `演唱会时间：${form.concertTime}`,
    `出发城市：${form.departureCity}`,
    form.departureDate && `出发日期：${form.departureDate}`,
    form.returnDate && `返程日期：${form.returnDate}`,
    dayCount !== '待定' && `行程天数：${dayCount}`,
    form.wantTour ? '是否游玩：是' : '是否游玩：否，只看演唱会',
    form.budget !== 'medium' && `预算：${ { low: '经济', medium: '适中', high: '宽裕' }[form.budget] }`,
    prefText,
    serviceText && `需要安排：${serviceText}`,
    form.notes && `备注：${form.notes}`,
  ].filter(Boolean);

  return `帮我规划一场完整的演唱会行程：从${form.departureDate || '出发日期'}出发到${form.returnDate || '返程日期'}返回，共${dayCount}。演唱会是${form.concertDate}的${form.singer || '演唱会'}。请按天详细规划每天的行程安排，包括交通、住宿、游玩景点和餐饮推荐。\n\n【详细信息】\n${parts.join('\n')}`;
}

function countDays(from, to) {
  const d1 = new Date(from);
  const d2 = new Date(to);
  return Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
}

export default TripPlanForm;