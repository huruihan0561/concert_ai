import React, { useState, useEffect, useRef } from 'react';
import { X, MapPin, Ticket, Info } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

const SeatMapViewer = ({ config, onAreaClick, onAskAI }) => {
  const [selectedArea, setSelectedArea] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const imageRef = useRef(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!config?.backgroundImage) return;
    if (imageRef.current) {
      const updateSize = () => {
        setImageSize({
          width: imageRef.current.offsetWidth,
          height: imageRef.current.offsetHeight,
        });
      };
      updateSize();
      window.addEventListener('resize', updateSize);
      return () => window.removeEventListener('resize', updateSize);
    }
  }, [config?.backgroundImage]);

  if (!config) {
    return (
      <div className="flex items-center justify-center h-48 text-white/30 text-sm gap-2">
        <Info className="w-4 h-4" />
        暂无座位图信息
      </div>
    );
  }

  const areas = config.areas || [];
  const tipMessage = config.message;
  const rawImageUrl = config.backgroundImage;

  const resolveImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${window.location.protocol}//${window.location.host}/concert/api/seatmap${path}`;
  };

  const imageUrl = resolveImageUrl(rawImageUrl);

  const handleAreaClick = (area) => {
    setSelectedArea(area);
    onAreaClick?.(area);
  };

  const handleAskAI = () => {
    if (selectedArea) {
      onAskAI?.(`${selectedArea.name}视野怎么样？价格是多少？`);
    }
  };

  const parseCoords = (coordsStr) => {
    if (!coordsStr) return [];
    return coordsStr.split(',').map((n) => parseInt(n.trim(), 10));
  };

  const getAreaStyle = (area) => {
    const coords = parseCoords(area.coords);
    if ((area.shape === 'rect' || area.shape === 'poly') && coords.length >= 4) {
      const [x1, y1, x2, y2] = coords;
      return {
        left: `${(x1 / imageSize.width) * 100}%`,
        top: `${(y1 / imageSize.height) * 100}%`,
        width: `${((x2 - x1) / imageSize.width) * 100}%`,
        height: `${((y2 - y1) / imageSize.height) * 100}%`,
      };
    }
    if (area.shape === 'circle' && coords.length >= 3) {
      const [cx, cy, r] = coords;
      return {
        left: `${((cx - r) / imageSize.width) * 100}%`,
        top: `${((cy - r) / imageSize.height) * 100}%`,
        width: `${((r * 2) / imageSize.width) * 100}%`,
        height: `${((r * 2) / imageSize.height) * 100}%`,
        borderRadius: '50%',
      };
    }
    return {};
  };

  return (
    <div className="relative">
      <div className="relative inline-block max-w-full">
        <img
          ref={imageRef}
          src={imageUrl}
          alt="座位图"
          className="max-w-full h-auto rounded-xl"
          useMap="#seatmap"
        />

        {imageSize.width > 0 && areas.map((area, index) => (
          <div
            key={area.id || index}
            className="absolute border-2 border-transparent hover:border-cyan-400/50 hover:bg-cyan-400/10 cursor-pointer transition-all"
            style={getAreaStyle(area)}
            onClick={() => handleAreaClick(area)}
            onMouseEnter={() => setTooltip({ area, x: 0, y: 0 })}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setTooltip({ area, x: e.clientX - rect.left, y: e.clientY - rect.top });
            }}
            onMouseLeave={() => setTooltip(null)}
          />
        ))}

        <map name="seatmap">
          {areas.map((area, index) => (
            <area
              key={area.id || index}
              shape={area.shape}
              coords={area.coords}
              alt={area.name}
              onClick={() => handleAreaClick(area)}
              className="cursor-pointer"
            />
          ))}
        </map>
      </div>

      {tipMessage && (
        <div className="mt-3 p-3 rounded-xl text-amber-200/80 text-xs"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <Info className="w-3.5 h-3.5 inline mr-1.5" />
          {tipMessage}
        </div>
      )}

      <AnimatePresence>
        {selectedArea && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(4,5,17,0.75)', backdropFilter: 'blur(8px)' }}
            onClick={() => setSelectedArea(null)}
          >
            <div
              className="rounded-2xl p-6 max-w-sm w-full"
              style={{ background: 'rgba(12,12,28,0.98)', border: '1px solid rgba(255,255,255,0.1)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-cyan-400" />
                  {selectedArea.name}
                </h3>
                <button onClick={() => setSelectedArea(null)} className="text-white/40 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                {selectedArea.priceRange && (
                  <div className="flex items-center gap-2 text-emerald-300">
                    <Ticket className="w-4 h-4" />
                    <span>票价: {selectedArea.priceRange}</span>
                  </div>
                )}
                {selectedArea.description && (
                  <p className="text-white/60 text-sm leading-relaxed">{selectedArea.description}</p>
                )}
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  onClick={handleAskAI}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
                  style={{ background: 'linear-gradient(135deg,#22d3ee,#a855f7)' }}
                >
                  问 AI
                </button>
                <button
                  onClick={() => setSelectedArea(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm text-white/70 transition-all"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SeatMapViewer;
