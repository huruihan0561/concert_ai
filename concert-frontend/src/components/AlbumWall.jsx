import { useRef, forwardRef } from 'react';

const AlbumWall = forwardRef(({ view, albums, onCardClick, containerRef }, ref) => {
  const internalRef = useRef(null);
  const canvasContainerRef = containerRef || internalRef;

  return (
    <section className={`view ${view === 'albums' ? 'active' : ''}`}>
      <div className="app">
        {/* Topbar */}
        <div className="topbar">
          <div className="topbar-icon">A</div>
          <b>Albums</b>
          <span>{albums.length} 张专辑</span>
        </div>

        {/* Hint */}
        <div className="hint">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 mr-2 opacity-60">
            <path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
          点击专辑卡片播放音乐
        </div>

        {/* Canvas container */}
        <div id="albumsCanvas" ref={canvasContainerRef}></div>
      </div>
    </section>
  );
});

export default AlbumWall;