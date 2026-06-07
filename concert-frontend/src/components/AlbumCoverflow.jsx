import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * 3D Coverflow Album Carousel
 * 中间专辑正面朝向，两侧专辑 3D 倾斜透视，附倒影效果
 */
function AlbumCoverflow({ albums, activeIndex, onSelect }) {
  const [dragStartX, setDragStartX] = useState(null);
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef(null);
  const wheelLock = useRef(false); // 滚轮防抖锁

  /* ── 键盘导航 ── */
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowLeft') onSelect(Math.max(0, activeIndex - 1));
      if (e.key === 'ArrowRight') onSelect(Math.min(albums.length - 1, activeIndex + 1));
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeIndex, albums.length, onSelect]);

  /* ── 鼠标滚轮 ── */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleWheel = (e) => {
      e.preventDefault();
      if (wheelLock.current) return;
      wheelLock.current = true;
      if (e.deltaY > 0 || e.deltaX > 0) {
        onSelect(Math.min(albums.length - 1, activeIndex + 1));
      } else {
        onSelect(Math.max(0, activeIndex - 1));
      }
      // 300ms 内只切一张，避免飞速滚动
      setTimeout(() => { wheelLock.current = false; }, 300);
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [activeIndex, albums.length, onSelect]);

  /* ── 触摸 / 鼠标拖拽 ── */
  const onDragStart = (clientX) => {
    setDragStartX(clientX);
    setDragging(false);
  };
  const onDragMove = (clientX) => {
    if (dragStartX === null) return;
    if (Math.abs(clientX - dragStartX) > 5) setDragging(true);
  };
  const onDragEnd = (clientX) => {
    if (dragStartX === null) return;
    const diff = clientX - dragStartX;
    if (Math.abs(diff) > 50) {
      if (diff < 0) onSelect(Math.min(albums.length - 1, activeIndex + 1));
      else onSelect(Math.max(0, activeIndex - 1));
    }
    setDragStartX(null);
    setDragging(false);
  };

  /* ── 计算每张专辑的 3D 变换 ── */
  const getStyle = (index) => {
    const offset = index - activeIndex;
    const absOffset = Math.abs(offset);

    // 超出可视范围直接隐藏
    if (absOffset > 4) return { display: 'none' };

    const sign = Math.sign(offset) || 1;

    // 水平位移：中心 0，每步 220px
    const translateX = offset * 220;
    // 远离中心时向后退（Z轴）
    const translateZ = absOffset === 0 ? 0 : -120 * absOffset;
    // Y轴旋转：两侧向外倾斜最多 55°
    const rotateY = offset === 0 ? 0 : sign * Math.min(55, 40 + absOffset * 5);
    // 缩放：中心最大，两侧递减
    const scale = offset === 0 ? 1 : Math.max(0.55, 1 - absOffset * 0.15);
    // 透明度：中心完全不透明
    const opacity = offset === 0 ? 1 : Math.max(0.3, 1 - absOffset * 0.25);
    // z-index：中心最高
    const zIndex = 100 - absOffset * 10;

    return {
      transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
      opacity,
      zIndex,
      cursor: offset === 0 ? 'default' : 'pointer',
      transition: dragging ? 'none' : 'transform 0.5s cubic-bezier(0.25,0.8,0.25,1), opacity 0.5s ease',
    };
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full select-none"
      style={{ height: '520px', perspective: '1000px' }}
      onMouseDown={(e) => onDragStart(e.clientX)}
      onMouseMove={(e) => onDragMove(e.clientX)}
      onMouseUp={(e) => onDragEnd(e.clientX)}
      onMouseLeave={(e) => dragStartX !== null && onDragEnd(e.clientX)}
      onTouchStart={(e) => onDragStart(e.touches[0].clientX)}
      onTouchMove={(e) => onDragMove(e.touches[0].clientX)}
      onTouchEnd={(e) => onDragEnd(e.changedTouches[0].clientX)}
    >
      {/* 环境光晕 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 50% 55%, rgba(139,92,246,0.18) 0%, transparent 70%)',
        }}
      />

      {/* 专辑卡片区 */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {albums.map((album, index) => {
          const style = getStyle(index);
          if (style.display === 'none') return null;
          const offset = index - activeIndex;
          const isActive = offset === 0;

          return (
            <div
              key={album.id}
              className="absolute"
              style={{
                width: '240px',
                transformStyle: 'preserve-3d',
                ...style,
              }}
              onClick={() => !dragging && onSelect(index)}
            >
              {/* 封面主体 */}
              <div
                className="relative rounded-2xl overflow-hidden shadow-2xl"
                style={{
                  width: '240px',
                  height: '240px',
                  boxShadow: isActive
                    ? '0 30px 80px rgba(139,92,246,0.6), 0 0 0 1px rgba(255,255,255,0.1)'
                    : '0 15px 40px rgba(0,0,0,0.7)',
                }}
              >
                <img
                  src={album.cover}
                  alt={album.title}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
                {/* 玻璃反光 */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 40%, transparent 60%)',
                  }}
                />
                {/* 激活时的播放遮罩 */}
                {isActive && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity duration-200">
                    <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                      <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7 ml-1">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>

              {/* 倒影 */}
              <div
                className="absolute left-0 right-0 rounded-2xl overflow-hidden pointer-events-none"
                style={{
                  top: '248px',
                  height: '100px',
                  transform: 'scaleY(-1)',
                  opacity: 0.25,
                  maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)',
                }}
              >
                <img src={album.cover} alt="" className="w-full h-full object-cover" draggable={false} />
              </div>

              {/* 当前专辑信息 */}
              {isActive && (
                <div className="mt-6 text-center">
                  <p className="text-white font-bold text-lg leading-tight truncate">{album.title}</p>
                  <p className="text-purple-300 text-sm mt-1">{album.artist}</p>
                  <p className="text-gray-500 text-xs mt-1">{album.tracks.length} 首歌曲</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 左右翻页按钮 */}
      <button
        onClick={() => onSelect(Math.max(0, activeIndex - 1))}
        disabled={activeIndex === 0}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center backdrop-blur-sm border border-white/10 transition-all"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-5 h-5">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <button
        onClick={() => onSelect(Math.min(albums.length - 1, activeIndex + 1))}
        disabled={activeIndex === albums.length - 1}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center backdrop-blur-sm border border-white/10 transition-all"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-5 h-5">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      {/* 分页点 */}
      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-50">
        {albums.map((_, i) => (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === activeIndex ? '20px' : '6px',
              height: '6px',
              background: i === activeIndex ? 'rgb(168,85,247)' : 'rgba(255,255,255,0.3)',
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default AlbumCoverflow;
