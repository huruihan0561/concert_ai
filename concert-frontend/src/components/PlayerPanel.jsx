import { useRef, useEffect, forwardRef } from 'react';

const PlayerPanel = forwardRef(({
  view,
  currentAlbum,
  currentTrack,
  songTitle,
  songArtist,
  playing,
  currentTimeText,
  durationText,
  status,
  seekValue,
  playerViewBg,
  togglePlay,
  nextTrack,
  prevTrack,
  backToAlbums,
  onSeekInput,
  onSeekChange,
  containerRef,
}, ref) => {
  const internalRef = useRef(null);
  const canvasContainerRef = containerRef || internalRef;

  return (
    <section className={`view ${view === 'player' ? 'active' : ''}`}>
      <div 
        className="app"
        id="playerView"
        style={{ background: playerViewBg || 'radial-gradient(ellipse 100% 100% at 50% 0%, #1a1a2e 0%, #0f0f14 50%, #0a0a0c 100%)' }}
      >
        <div id="playerCanvas" ref={canvasContainerRef}></div>
        
        {/* Topbar */}
        <div className="player-topbar">
          <div className="topbar-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
          <b>NOW PLAYING</b>
          <span>{currentAlbum?.tracks?.length || 0} tracks</span>
        </div>
        
        {/* Album Info Overlay */}
        <div className="album-overlay">
          <div className="album-cover-shadow"></div>
        </div>
        
        {/* Player controls */}
        <div className="player-controls-wrapper">
          <div className="player-controls">
            <div className="song-info">
              <h2 className="song-title">{songTitle}</h2>
              <p className="song-artist">{songArtist}</p>
            </div>

            <div className="player-buttons">
              <button className="control-btn" onClick={prevTrack}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9H4.5a2.5 2.5 0 0 0 0 5H6M13 6v12M17 6v12M6 6v12" />
                </svg>
              </button>
              
              <button className="control-btn play-btn" onClick={togglePlay}>
                {playing ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
              
              <button className="control-btn" onClick={nextTrack}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 9h1.5a2.5 2.5 0 0 1 0 5H18M11 6v12M7 6v12M18 6v12" />
                </svg>
              </button>
            </div>

            <div className="player-seek">
              <span className="seek-time">{currentTimeText}</span>
              <div className="seek-track">
                <div 
                  className="seek-progress"
                  style={{ width: `${seekValue / 10}%` }}
                />
                <input
                  type="range"
                  min="0"
                  max="1000"
                  value={seekValue}
                  onChange={onSeekChange}
                  onInput={onSeekInput}
                  className="seek-bar"
                />
              </div>
              <span className="seek-time">{durationText}</span>
            </div>

            <div className="status-text">{status}</div>
          </div>
        </div>

        {/* Back button */}
        <button className="back" onClick={backToAlbums}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 mr-2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          返回专辑墙
        </button>

        {/* Track list */}
        {currentAlbum && currentAlbum.tracks && currentAlbum.tracks.length > 1 && (
          <div className="track-list">
            <h3>{currentAlbum.title}</h3>
            <div className="track-items">
              {currentAlbum.tracks.map((track, index) => (
                <div 
                  key={index}
                  className={`track-item ${
                    index === currentTrack ? 'active' : ''
                  }`}
                >
                  <span className="track-number">{index + 1}</span>
                  <span className="track-title">{track.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
});

export default PlayerPanel;