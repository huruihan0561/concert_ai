import { useState, useCallback, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { formatTime, shuffleArray, rgbToHex, colorMix } from '../utils/playerUtils';
import { ALBUMS_DATA } from './albumData';

export function useMusicPlayer() {
  const [view, setView] = useState('albums');
  const [albums, setAlbums] = useState([]);
  const [selected, setSelected] = useState(0);
  const [targetSelected, setTargetSelected] = useState(0);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [seeking, setSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);
  const [status, setStatus] = useState('点击播放按钮开始');
  const [songTitle, setSongTitle] = useState('请选择一个专辑');
  const [songArtist, setSongArtist] = useState('这里显示当前歌曲名');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playerViewBg, setPlayerViewBg] = useState('');
  const [isDarkMode] = useState(true);

  const gallery = { cam: 14.5, gap: 2.2, tilt: 8, speed: 0.15 };
  const coverCache = useRef(new Map());
  const albumsRef = useRef(albums);
  const targetSelectedRef = useRef(targetSelected);
  const selectedRef = useRef(selected);
  const audioRef = useRef(new Audio());
  audioRef.current.preload = 'metadata';
  audioRef.current.volume = 0.7;

  const audioContextRef = useRef(null);
  const audioSourceRef = useRef(null);

  const galleryStateRef = useRef({ scene: null, camera: null, renderer: null, group: null, cards: [], raycaster: new THREE.Raycaster(), pointer: new THREE.Vector2(), container: null });
  const playerStateRef = useRef({ scene: null, camera: null, renderer: null, disc: null, sleeveCover: null, labelMesh: null, recordGroup: null, container: null, isSliding: false, slideProgress: 0, slideTarget: 0, sleeveGroup: null });
  const loaderRef = useRef(new THREE.TextureLoader());

  const onTimeUpdateRef = useRef(null);

  useEffect(() => {
    albumsRef.current = albums;
  }, [albums]);

  useEffect(() => {
    targetSelectedRef.current = targetSelected;
  }, [targetSelected]);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  const currentAlbum = albums[selected] || null;
  const currentTimeText = formatTime(currentTime);
  const durationText = formatTime(duration);

  function defaultCover(label = 'MUSIC') {
    const canvas = document.createElement('canvas');
    canvas.width = 900; canvas.height = 900;
    const ctx = canvas.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 900, 900);
    g.addColorStop(0, '#0a1a2e');
    g.addColorStop(0.5, '#1a0a2e');
    g.addColorStop(1, '#0a0a0f');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 900, 900);
    ctx.fillStyle = 'rgba(0, 243, 255, 0.05)';
    for (let i = 0; i < 20; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * 900, Math.random() * 900, 20 + Math.random() * 60, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.arc(450, 450, 200, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '800 72px Inter, sans-serif';
    ctx.fillText(label, 450, 450);
    return canvas.toDataURL('image/png');
  }

  function applyCamera() {
    if (galleryStateRef.current.camera) {
      galleryStateRef.current.camera.position.z = gallery.cam;
      renderGallery();
    }
  }

  function tex(src) {
    return new Promise((resolve, reject) => {
      loaderRef.current.load(src, (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        resolve(t);
      }, undefined, (event) => {
        console.warn('Texture loading failed for:', src);
        reject(new Error('Failed to load texture: ' + src));
      });
    });
  }

  async function resolveCover(album) {
    if (coverCache.current.has(album.title)) return coverCache.current.get(album.title);
    const cover = album.cover || defaultCover(album.title);
    coverCache.current.set(album.title, cover);
    return cover;
  }

  async function dominantColorFromImage(src) {
    return await new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas'); canvas.width = 24; canvas.height = 24;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(img, 0, 0, 24, 24);
          const data = ctx.getImageData(0, 0, 24, 24).data;
          let r = 0, g = 0, b = 0, count = 0;
          for (let i = 0; i < data.length; i += 4) {
            const a = data[i + 3]; if (a < 50) continue;
            const rr = data[i], gg = data[i + 1], bb = data[i + 2];
            if (Math.max(rr, gg, bb) - Math.min(rr, gg, bb) < 18) continue;
            r += rr; g += gg; b += bb; count++;
          }
          resolve(count ? rgbToHex(r / count, g / count, b / count) : '#888888');
        } catch { resolve('#888888'); }
      };
      img.onerror = () => resolve('#888888');
      img.src = src;
    });
  }

  async function guessThemeColor(cover) {
    return colorMix(cover ? await dominantColorFromImage(cover) : '#888888', '#000000', 0.15);
  }

  const fetchAlbums = useCallback(async () => {
    const shuffledAlbums = shuffleArray(ALBUMS_DATA || []);
    setAlbums(shuffledAlbums);
    if (!shuffledAlbums.length) {
      setSongTitle('没有扫描到专辑');
      setSongArtist('请检查专辑数据配置');
    }
    return shuffledAlbums;
  }, []);

  async function applyGalleryCover(index) {
    const album = albums[index];
    if (!album || !galleryStateRef.current.cards[index]) return;
    const cover = await resolveCover(album);
    const t = await tex(cover);
    const card = galleryStateRef.current.cards[index];
    if (card.front.map) card.front.map.dispose?.();
    card.front.map = t;
    card.front.needsUpdate = true;
  }

  function updateTrackInfo() {
    const album = currentAlbum;
    if (!album) return;
    const track = album.tracks[currentTrack];
    setSongTitle(track ? track.title : album.title);
    setSongArtist(album.title);
    setStatus('点击播放按钮开始');
    if (audioRef.current.duration) setDuration(audioRef.current.duration);
  }

  const selectAlbum = useCallback(async (index, openPlayer = false) => {
    setSelected(index);
    setTargetSelected(index);
    setCurrentTrack(0);
    await applyGalleryCover(index);
    updateTrackInfo();
    if (openPlayer) await openTrack(index, 0);
  }, [albums, currentAlbum, currentTrack]);

  const openTrack = useCallback(async (albumIndex, trackIndex) => {
    const album = albums[albumIndex];
    if (!album) return;
    const track = album.tracks[trackIndex];
    if (!track) return;
    setSelected(albumIndex);
    setTargetSelected(albumIndex);
    setCurrentTrack(trackIndex);
    const cover = await resolveCover(album);
    audioRef.current.pause();
    audioRef.current.src = track.file;
    audioRef.current.load();
    setSongTitle(track.title);
    setSongArtist(album.title);
    setStatus('点击播放按钮开始');
    setView('player');
    galleryStateRef.current.view = 'player';
    syncPlay();
    await applyPlayerCover(cover);
    await renderGallery();
    if (playerStateRef.current.recordGroup) playerStateRef.current.recordGroup.visible = true;
  }, [albums]);

  async function applyPlayerCover(src) {
    const t = await tex(src);
    t.wrapS = THREE.ClampToEdgeWrapping;
    t.wrapT = THREE.ClampToEdgeWrapping;
    if (playerStateRef.current.sleeveCover) {
      playerStateRef.current.sleeveCover.material.map = t;
      playerStateRef.current.sleeveCover.material.needsUpdate = true;
    }
    if (playerStateRef.current.labelMesh) {
      playerStateRef.current.labelMesh.material.map = t;
      playerStateRef.current.labelMesh.material.needsUpdate = true;
      playerStateRef.current.labelMesh.material.transparent = false;
      playerStateRef.current.labelMesh.material.opacity = 1.0;
    }
    extractAndApplyThemeColor(src);
  }

  function extractAndApplyThemeColor(imgUrl) {
    setPlayerViewBg('linear-gradient(180deg, #0a0a0c 0%, #111114 100%)');
  }

  const nextTrack = useCallback(() => {
    const album = currentAlbum;
    if (!album) return;
    const nextTrackIdx = currentTrack + 1;
    if (nextTrackIdx < album.tracks.length) {
      openTrack(selected, nextTrackIdx).then(() => audioRef.current.play().catch(() => {}));
    } else {
      const nextAlbumIdx = (selected + 1) % albums.length;
      setSelected(nextAlbumIdx);
      openTrack(nextAlbumIdx, 0).then(() => audioRef.current.play().catch(() => {}));
    }
  }, [currentAlbum, currentTrack, selected, albums, openTrack]);

  const prevTrack = useCallback(() => {
    const album = currentAlbum;
    if (!album) return;
    const prevTrackIdx = currentTrack - 1;
    if (prevTrackIdx >= 0) {
      openTrack(selected, prevTrackIdx).then(() => audioRef.current.play().catch(() => {}));
    } else {
      const prevAlbumIdx = (selected - 1 + albums.length) % albums.length;
      setSelected(prevAlbumIdx);
      const prevAlbum = albums[prevAlbumIdx];
      if (prevAlbum) {
        openTrack(prevAlbumIdx, prevAlbum.tracks.length - 1).then(() => audioRef.current.play().catch(() => {}));
      }
    }
  }, [currentAlbum, currentTrack, selected, albums, openTrack]);

  function initGallery(container) {
    galleryStateRef.current.container = container;
    galleryStateRef.current.view = 'albums';
    galleryStateRef.current.scene = new THREE.Scene();
    galleryStateRef.current.camera = new THREE.PerspectiveCamera(40, container?.clientWidth / container?.clientHeight || 1, 0.1, 100);
    galleryStateRef.current.camera.position.set(0, 0.4, gallery.cam);
    galleryStateRef.current.camera.lookAt(0, 0.2, 0);
    galleryStateRef.current.renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance", // 启用高性能GPU
      preserveDrawingBuffer: false // 优化性能
    });
    galleryStateRef.current.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    galleryStateRef.current.renderer.outputColorSpace = THREE.SRGBColorSpace;
    galleryStateRef.current.renderer.setClearColor(0x000000, 0);
    galleryStateRef.current.renderer.autoClear = false;
    galleryStateRef.current.renderer.domElement.style.background = 'transparent';
    galleryStateRef.current.renderer.domElement.style.width = '100%';
    galleryStateRef.current.renderer.domElement.style.height = '100%';
    container.appendChild(galleryStateRef.current.renderer.domElement);

    galleryStateRef.current.scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const key = new THREE.DirectionalLight(0xffffff, 1.8);
    key.position.set(5, 8, 6);
    galleryStateRef.current.scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.4);
    fill.position.set(-4, -2, 4);
    galleryStateRef.current.scene.add(fill);

    galleryStateRef.current.group = new THREE.Group();
    galleryStateRef.current.scene.add(galleryStateRef.current.group);

    const starCount = 2000;
    const starPositions = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);
    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3 + 0] = (Math.random() - 0.5) * 120;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 60;
      starPositions[i * 3 + 2] = (Math.random() - 0.5) * 80 - 10;
      starSizes[i] = Math.random() * 2.5 + 0.5;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
    const starMat = new THREE.PointsMaterial({
      color: 0x67e8f9,
      size: 0.045,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.7,
    });
    const stars = new THREE.Points(starGeo, starMat);
    galleryStateRef.current.scene.add(stars);

    const gridHelper = new THREE.GridHelper(80, 40, 0x00f3ff, 0x00f3ff);
    gridHelper.position.y = -10;
    gridHelper.material.opacity = 0.06;
    gridHelper.material.transparent = true;
    galleryStateRef.current.scene.add(gridHelper);

    galleryStateRef.current.scene.background = null;
  }

  function initPlayerScene(container) {
    playerStateRef.current.container = container;
    playerStateRef.current.scene = new THREE.Scene();
    playerStateRef.current.camera = new THREE.PerspectiveCamera(32, 1.3, 0.1, 100);
    playerStateRef.current.camera.position.set(0.8, 0.6, 7.8);
    playerStateRef.current.camera.lookAt(0, -0.3, 0);
    playerStateRef.current.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    playerStateRef.current.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    playerStateRef.current.renderer.outputColorSpace = THREE.SRGBColorSpace;
    playerStateRef.current.renderer.setClearColor(0x000000, 0);
    playerStateRef.current.renderer.domElement.style.background = 'transparent';
    container.appendChild(playerStateRef.current.renderer.domElement);

    playerStateRef.current.scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const d = new THREE.DirectionalLight(0xffffff, 1.5);
    d.position.set(4, 5, 6);
    playerStateRef.current.scene.add(d);
    const fill = new THREE.DirectionalLight(0xffffff, 0.4);
    fill.position.set(-4, -1, 3);
    playerStateRef.current.scene.add(fill);

    const starCount = 1500;
    const starPositions = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);
    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3 + 0] = (Math.random() - 0.5) * 120;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 60;
      starPositions[i * 3 + 2] = (Math.random() - 0.5) * 80 - 10;
      starSizes[i] = Math.random() * 2.5 + 0.5;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
    const starMat = new THREE.PointsMaterial({
      color: 0x67e8f9,
      size: 0.045,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.7,
    });
    const stars = new THREE.Points(starGeo, starMat);
    playerStateRef.current.scene.add(stars);

    const gridHelper = new THREE.GridHelper(80, 40, 0x00f3ff, 0x00f3ff);
    gridHelper.position.y = -10;
    gridHelper.material.opacity = 0.06;
    gridHelper.material.transparent = true;
    playerStateRef.current.scene.add(gridHelper);

    const sleeveGroup = new THREE.Group();
    playerStateRef.current.scene.add(sleeveGroup);
    sleeveGroup.position.set(-2.0, 0.25, -0.5);
    sleeveGroup.rotation.y = 0.2;
    playerStateRef.current.sleeveGroup = sleeveGroup;

    playerStateRef.current.scene.background = null;

    const sleeveThickness = 0.25;
    const sleeveBox = new THREE.Mesh(
      new THREE.BoxGeometry(5.5, 5.5, sleeveThickness),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.85, metalness: 0.05 })
    );
    sleeveBox.position.z = -sleeveThickness / 2;
    sleeveGroup.add(sleeveBox);

    const sleeveBack = new THREE.Mesh(
      new THREE.PlaneGeometry(5.4, 5.4),
      new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.9, metalness: 0 })
    );
    sleeveBack.position.z = -sleeveThickness / 2 - 0.001;
    sleeveGroup.add(sleeveBack);

    playerStateRef.current.sleeveCover = new THREE.Mesh(
      new THREE.PlaneGeometry(5.2, 5.2),
      new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })
    );
    playerStateRef.current.sleeveCover.position.z = sleeveThickness / 2 + 0.02;
    sleeveGroup.add(playerStateRef.current.sleeveCover);

    const sleeveEdge = new THREE.Mesh(
      new THREE.BoxGeometry(5.5, 5.5, 0.02),
      new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.7, metalness: 0.1 })
    );
    sleeveEdge.position.z = sleeveThickness / 2;
    sleeveGroup.add(sleeveEdge);

    const leftFlap = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 5.5, sleeveThickness * 0.4),
      new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.9, metalness: 0 })
    );
    leftFlap.position.set(-2.76, 0, -sleeveThickness * 0.3);
    leftFlap.rotation.y = Math.PI / 6;
    sleeveGroup.add(leftFlap);

    const rightFlap = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 5.5, sleeveThickness * 0.4),
      new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.9, metalness: 0 })
    );
    rightFlap.position.set(2.76, 0, -sleeveThickness * 0.3);
    rightFlap.rotation.y = -Math.PI / 6;
    sleeveGroup.add(rightFlap);

    const recordGroup = new THREE.Group();
    playerStateRef.current.scene.add(recordGroup);
    playerStateRef.current.disc = recordGroup;
    playerStateRef.current.recordGroup = recordGroup;
    recordGroup.position.set(1.3, -0.15, -1.2);
    recordGroup.scale.setScalar(0.85);
    recordGroup.visible = true;

    const discBase = new THREE.Mesh(
      new THREE.CylinderGeometry(2.5, 2.5, 0.06, 128),
      new THREE.MeshStandardMaterial({
        color: 0x0a0a0a,
        roughness: 0.08,
        metalness: 0.15,
        envMapIntensity: 0.5
      })
    );
    discBase.rotation.x = Math.PI / 2;
    discBase.position.z = 0;
    recordGroup.add(discBase);

    for (let i = 0; i < 12; i++) {
      const groove = new THREE.Mesh(
        new THREE.TorusGeometry(2.45 - i * 0.12, 0.004, 2, 64),
        new THREE.MeshStandardMaterial({
          color: 0x1a1a1a,
          roughness: 0.15,
          metalness: 0.05
        })
      );
      groove.position.z = 0.031;
      recordGroup.add(groove);
    }

    const edge = new THREE.Mesh(
      new THREE.TorusGeometry(2.47, 0.02, 8, 64),
      new THREE.MeshStandardMaterial({
        color: 0x2a2a2a,
        roughness: 0.3,
        metalness: 0.35
      })
    );
    edge.position.z = 0.032;
    recordGroup.add(edge);

    const innerEdge = new THREE.Mesh(
      new THREE.TorusGeometry(1.23, 0.015, 8, 64),
      new THREE.MeshStandardMaterial({
        color: 0x353535,
        roughness: 0.4,
        metalness: 0.25
      })
    );
    innerEdge.position.z = 0.033;
    recordGroup.add(innerEdge);

    playerStateRef.current.labelMesh = new THREE.Mesh(
      new THREE.CircleGeometry(1.17, 64),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.3,
        metalness: 0.1,
        transparent: true,
        opacity: 1.0
      })
    );
    playerStateRef.current.labelMesh.position.z = 0.035;
    recordGroup.add(playerStateRef.current.labelMesh);

    const centerHole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.07, 32),
      new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.5,
        metalness: 0.4
      })
    );
    centerHole.rotation.x = Math.PI / 2;
    centerHole.position.z = 0.035;
    recordGroup.add(centerHole);
  }

  const renderGallery = useCallback(async (albumsData = albums) => {
    const group = galleryStateRef.current.group;
    if (!group) return;
    
    while (group.children.length) group.remove(group.children[0]);
    galleryStateRef.current.cards = [];

    const albumsToRender = albumsData.length > 0 ? albumsData : [{ title: 'MUSIC', cover: null }];
    
    for (let i = 0; i < albumsToRender.length; i++) {
      try {
        const album = albumsToRender[i];
        const coverUrl = album ? await resolveCover(album) : defaultCover('MUSIC');
        
        let t;
        try {
          t = await tex(coverUrl);
        } catch {
          const defaultCanvas = document.createElement('canvas');
          defaultCanvas.width = 900;
          defaultCanvas.height = 900;
          const ctx = defaultCanvas.getContext('2d');
          const g = ctx.createLinearGradient(0, 0, 900, 900);
          g.addColorStop(0, '#1a1a2e');
          g.addColorStop(0.5, '#2d1f47');
          g.addColorStop(1, '#0a0a0f');
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, 900, 900);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = '800 72px Inter, sans-serif';
          ctx.fillText(album?.title || 'MUSIC', 450, 450);
          const fallbackTexture = new THREE.CanvasTexture(defaultCanvas);
          fallbackTexture.colorSpace = THREE.SRGBColorSpace;
          t = fallbackTexture;
        }
        
        const accent = await guessThemeColor(coverUrl);

        const materials = [
          new THREE.MeshStandardMaterial({
            color: new THREE.Color(accent).multiplyScalar(0.55),
            roughness: 0.85,
            metalness: 0.05
          }),
          new THREE.MeshStandardMaterial({
            color: new THREE.Color(accent).multiplyScalar(0.55),
            roughness: 0.85,
            metalness: 0.05
          }),
          new THREE.MeshStandardMaterial({
            color: new THREE.Color(accent).multiplyScalar(0.7),
            roughness: 0.88,
            metalness: 0.03
          }),
          new THREE.MeshStandardMaterial({
            color: new THREE.Color(accent).multiplyScalar(0.7),
            roughness: 0.88,
            metalness: 0.03
          }),
          new THREE.MeshBasicMaterial({ map: t }),
          new THREE.MeshBasicMaterial({ map: t }),
        ];

        const wrap = new THREE.Group();
        const delta = i - targetSelectedRef.current;
        const depth = Math.abs(delta);
        wrap.position.set(0, delta * -gallery.gap * 0.95, -depth * 0.15);
        wrap.rotation.x = THREE.MathUtils.degToRad(88 - gallery.tilt);
        wrap.rotation.z = THREE.MathUtils.degToRad(delta * -0.3);
        wrap.scale.setScalar(Math.max(0.88, 1 - depth * 0.035));
        wrap.visible = depth < 20;

        const box = new THREE.Mesh(new THREE.BoxGeometry(7.1, 8.16, 0.18), materials);
        wrap.add(box);

        const glowGeometry = new THREE.PlaneGeometry(7.5, 8.6);
        const glowMaterial = new THREE.MeshBasicMaterial({
          color: new THREE.Color(0x00f3ff),
          transparent: true,
          opacity: 0,
          side: THREE.DoubleSide
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.z = 0.15;
        glow.scale.setScalar(1.02);
        wrap.add(glow);

        group.add(wrap);
        galleryStateRef.current.cards.push({ wrap, box, front: materials[4], glow, accent });
      } catch (error) {
        console.warn('Failed to render album:', albumsToRender[i]?.title, error);
      }
    }
  }, [targetSelected, albums, gallery.gap, gallery.tilt]);

  const animateRef = useRef(null);

  function animate() {
    animateRef.current = requestAnimationFrame(animate);
    
    const galleryState = galleryStateRef.current;
    const playerState = playerStateRef.current;
    
    if (galleryState.renderer && galleryState.scene && galleryState.camera && galleryState.cards.length > 0) {
      const currentTarget = targetSelectedRef.current;
      let currentSelected = selectedRef.current;
      
      // 优化动画平滑度，设置翻动速度为0.18，更加丝滑
      const diff = currentTarget - currentSelected;
      if (Math.abs(diff) > 0.001) {
        currentSelected += diff * 0.18;
        selectedRef.current = currentSelected;
      } else {
        currentSelected = currentTarget;
        selectedRef.current = currentTarget;
      }

      const cards = galleryState.cards;
      const visibleRange = 15;
      const startIdx = Math.max(0, Math.floor(currentSelected) - visibleRange);
      const endIdx = Math.min(cards.length - 1, Math.floor(currentSelected) + visibleRange);

      for (let i = startIdx; i <= endIdx; i++) {
        const card = cards[i];
        const delta = i - currentSelected;
        const depth = Math.abs(delta);
        
        // 增加垂直间距，避免专辑重叠
        card.wrap.position.y = delta * -gallery.gap * 1.2;
        // 增加Z轴深度，使前后专辑有明显层次感
        card.wrap.position.z = -depth * 0.4;
        
        // 调整旋转角度，确保专辑封面正面朝向用户
        const baseRotation = THREE.MathUtils.degToRad(65 - gallery.tilt);
        const sideRotation = THREE.MathUtils.degToRad(delta * -0.05);
        
        card.wrap.rotation.x = baseRotation;
        card.wrap.rotation.z = sideRotation;

        // 调整缩放，使远处的专辑更小
        let cardScale = Math.max(0.75, 1 - depth * 0.05);
        if (depth < 0.5 && card.glow) {
          cardScale = Math.max(cardScale, 1.02);
        }
        card.wrap.scale.setScalar(cardScale);

        card.wrap.visible = depth < visibleRange;

        if (card.glow) {
          const isSelected = depth < 0.5;
          const targetOpacity = isSelected ? 0.35 : 0;
          card.glow.material.opacity += (targetOpacity - card.glow.material.opacity) * 0.2;

          if (isSelected) {
            const pulse = Math.sin(Date.now() * 0.003) * 0.1 + 0.9;
            card.glow.scale.setScalar(1.02 * pulse);
          } else {
            card.glow.scale.setScalar(1.02);
          }
        }
      }
      
      // 启用硬件加速的渲染
      galleryState.renderer.setPixelRatio(window.devicePixelRatio);
      galleryState.renderer.render(galleryState.scene, galleryState.camera);
    }
    if (playerStateRef.current.renderer) {
      if (playerStateRef.current.isSliding && playerStateRef.current.recordGroup) {
        const targetProgress = playerStateRef.current.slideTarget;
        const step = 0.025;
        if (playerStateRef.current.slideProgress < targetProgress) {
          playerStateRef.current.slideProgress = Math.min(playerStateRef.current.slideProgress + step, targetProgress);
        } else if (playerStateRef.current.slideProgress > targetProgress) {
          playerStateRef.current.slideProgress = Math.max(playerStateRef.current.slideProgress - step, targetProgress);
        }
        if (Math.abs(playerStateRef.current.slideProgress - targetProgress) < 0.001) {
          playerStateRef.current.slideProgress = targetProgress;
          playerStateRef.current.isSliding = false;
        }
        const eased = 1 - Math.pow(1 - playerStateRef.current.slideProgress, 4);
        const startZ = -1.2;
        const endZ = 0.4;
        playerStateRef.current.recordGroup.position.z = startZ + (endZ - startZ) * eased;
        playerStateRef.current.recordGroup.rotation.y = eased * 0.45;
        if (playerStateRef.current.sleeveGroup) {
          const sleeveEase = 1 - Math.pow(1 - Math.min(playerStateRef.current.slideProgress * 1.5, 1), 4);
          playerStateRef.current.sleeveGroup.rotation.y = 0.2 - sleeveEase * 0.15;
        }
      }
      if (playerStateRef.current.disc && playing) {
        playerStateRef.current.disc.rotation.z += 0.004;
      }
      playerStateRef.current.renderer.render(playerStateRef.current.scene, playerStateRef.current.camera);
    }
  }

  function onGalleryClick(event) {
    const currentAlbums = albumsRef.current;
    if (!currentAlbums.length) return;
    
    const galleryState = galleryStateRef.current;
    const container = galleryState.container;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    
    // 计算鼠标在 canvas 中的归一化设备坐标 (-1 到 1)
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // 更新射线起点和方向
    galleryState.raycaster.setFromCamera(new THREE.Vector2(x, y), galleryState.camera);
    
    // 获取所有可点击的卡片对象
    const cards = galleryState.cards;
    if (!cards || cards.length === 0) return;
    
    // 创建用于射线检测的对象数组
    const clickableObjects = [];
    const objectToIndex = new Map();
    
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      // 使用 card.box 进行射线检测，因为卡片对象没有 mesh 属性
      if (card.wrap.visible && card.box) {
        clickableObjects.push(card.box);
        objectToIndex.set(card.box, i);
      }
    }
    
    // 执行射线检测
    const intersects = galleryState.raycaster.intersectObjects(clickableObjects, false);
    
    if (intersects.length > 0) {
      // 获取点击的第一张专辑
      const clickedMesh = intersects[0].object;
      const clickedIndex = objectToIndex.get(clickedMesh);
      
      if (clickedIndex !== undefined && clickedIndex >= 0 && clickedIndex < currentAlbums.length) {
        console.log('点击了专辑:', clickedIndex, currentAlbums[clickedIndex]?.title);
        selectAlbum(clickedIndex, true);
      }
    }
  }

  function resize() {
    const galleryState = galleryStateRef.current;
    const playerState = playerStateRef.current;
    if (!galleryState.renderer || !playerState.renderer || !galleryState.container || !playerState.container) return;
    const albumsWidth = galleryState.container.clientWidth, albumsHeight = galleryState.container.clientHeight;
    galleryState.renderer.setSize(albumsWidth, albumsHeight);
    galleryState.camera.aspect = albumsWidth / albumsHeight;
    galleryState.camera.updateProjectionMatrix();
    const playerWidth = playerState.container.clientWidth, playerHeight = playerState.container.clientHeight;
    playerState.renderer.setSize(playerWidth, playerHeight);
    playerState.camera.aspect = playerWidth / playerHeight;
    playerState.camera.updateProjectionMatrix();
  }

  function syncPlay() {
    setPlaying(!audioRef.current.paused && !audioRef.current.ended);
  }

  const togglePlay = useCallback(async () => {
    if (!audioRef.current.src && currentAlbum) await openTrack(selected, currentTrack);
    if (audioRef.current.paused) {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        audioSourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
        audioSourceRef.current.connect(audioContextRef.current.destination);
      }
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      if (playerStateRef.current.recordGroup) {
        playerStateRef.current.slideTarget = 1;
        playerStateRef.current.isSliding = true;
      }
      try { await audioRef.current.play(); } catch { setStatus('浏览器阻止了播放，请再次点击'); }
    } else {
      audioRef.current.pause();
      if (playerStateRef.current.recordGroup) {
        playerStateRef.current.slideTarget = 0;
        playerStateRef.current.isSliding = true;
      }
    }
  }, [currentAlbum, selected, currentTrack, openTrack]);

  const backToAlbums = useCallback(() => {
    setView('albums');
    galleryStateRef.current.view = 'albums';
    setTargetSelected(selected);
    renderGallery(albums);
  }, [albums, renderGallery, selected]);

  function onSeekInput(e) {
    const newValue = parseFloat(e.target.value);
    if (!isNaN(newValue)) {
      setSeeking(true);
      setSeekValue(newValue);
    }
  }

  function onSeekChange(e) {
    const newValue = parseFloat(e.target.value);
    if (!isNaN(newValue) && Number.isFinite(audioRef.current.duration) && audioRef.current.duration > 0) {
      const newTime = audioRef.current.duration * (newValue / 1000);
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      setSeekValue(newValue);
    }
    setSeeking(false);
  }

  function wheelSelect(dir) {
    const currentAlbums = albumsRef.current;
    if (!currentAlbums.length) return;
    const next = Math.max(0, Math.min(currentAlbums.length - 1, Math.round(targetSelected + dir)));
    setTargetSelected(next);
  }

  let cleanupScroll = null;
  let resizeHandler = null;
  let clickHandler = null;

  const initPlayer = useCallback(async (galleryContainer, playerContainer) => {
    if (!galleryContainer || !playerContainer) {
      throw new Error('Container elements not found');
    }
    
    initGallery(galleryContainer);
    initPlayerScene(playerContainer);
    addAudioEvents();
    const fetchedAlbums = await fetchAlbums();
    await renderGallery(fetchedAlbums);
    if (fetchedAlbums.length > 0) {
      await selectAlbum(0, false);
    }
    cleanupScroll = bindScroll();
    animate();
    resizeHandler = () => resize();
    clickHandler = (e) => onGalleryClick(e);
    window.addEventListener('resize', resizeHandler);
    galleryContainer.addEventListener('click', clickHandler);
    resize();
  }, []);

  function bindScroll() {
    let lastScrollTime = 0;
    const scrollThrottle = 80; // 增加节流间隔，确保每次只滚动一张
    
    const onWheel = (e) => {
      const currentView = galleryStateRef.current.view;
      if (currentView !== 'albums') return;
      
      const container = galleryStateRef.current.container;
      if (!container) return;
      
      const rect = container.getBoundingClientRect();
      const eventX = e.clientX;
      const eventY = e.clientY;
      
      if (eventX < rect.left || eventX > rect.right || eventY < rect.top || eventY > rect.bottom) {
        return;
      }
      
      const currentTime = Date.now();
      if (currentTime - lastScrollTime < scrollThrottle) {
        return;
      }
      lastScrollTime = currentTime;
      
      e.preventDefault();
      
      const currentAlbums = albumsRef.current;
      if (!currentAlbums.length) return;
      
      // 确保每次只滚动一张专辑
      const direction = e.deltaY > 0 ? 1 : -1;
      const current = Math.round(targetSelectedRef.current);
      const next = Math.max(0, Math.min(currentAlbums.length - 1, current + direction));
      
      // 只有当目标改变时才更新
      if (next !== targetSelectedRef.current) {
        setTargetSelected(next);
      }
    };
    
    let touchStartY = 0;
    let touchAccumulator = 0;
    let lastTouchTime = 0;
    const touchThrottle = 16;
    const scrollThreshold = 30;
    
    const onTouchStart = (e) => {
      touchStartY = e.touches[0].clientY;
      touchAccumulator = 0;
    };
    
    const onTouchMove = (e) => {
      const currentView = galleryStateRef.current.view;
      if (currentView !== 'albums') return;
      
      // 节流处理，避免频繁触发
      const currentTime = Date.now();
      if (currentTime - lastTouchTime < touchThrottle) {
        return;
      }
      lastTouchTime = currentTime;
      
      const currentAlbums = albumsRef.current;
      if (!currentAlbums.length) return;
      
      const currentY = e.touches[0].clientY;
      touchAccumulator += touchStartY - currentY;
      touchStartY = currentY;
      
      if (Math.abs(touchAccumulator) >= scrollThreshold) {
        const steps = Math.floor(Math.abs(touchAccumulator) / scrollThreshold);
        const direction = touchAccumulator > 0 ? 1 : -1;
        const next = Math.max(0, Math.min(currentAlbums.length - 1, targetSelectedRef.current + direction * steps));
        setTargetSelected(next);
        touchAccumulator = touchAccumulator % scrollThreshold;
      }
    };
    
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }

  function addAudioEvents() {
    audioRef.current.addEventListener('timeupdate', () => {
      if (!seeking) {
        setSeekValue((audioRef.current.currentTime / Math.max(audioRef.current.duration || 1, 1)) * 1000);
        setCurrentTime(audioRef.current.currentTime);
      }
      if (audioRef.current.duration) setDuration(audioRef.current.duration);
      if (onTimeUpdateRef.current) onTimeUpdateRef.current();
    });
    audioRef.current.addEventListener('loadedmetadata', () => { setDuration(audioRef.current.duration); });
    audioRef.current.addEventListener('play', () => { setPlaying(true); syncPlay(); setStatus('正在播放'); });
    audioRef.current.addEventListener('pause', () => { setPlaying(false); syncPlay(); setStatus('已暂停'); });
    audioRef.current.addEventListener('ended', nextTrack);
    audioRef.current.addEventListener('error', () => { setStatus('音频加载失败，请检查文件格式或路径'); });
  }

  // 监听 targetSelected 变化，自动重新渲染画廊
  useEffect(() => {
    if (view === 'albums' && albums.length > 0 && galleryStateRef.current.group) {
      renderGallery(albums);
    }
  }, [targetSelected, albums, view, renderGallery]);

  useEffect(() => {
    return () => {
      if (cleanupScroll) cleanupScroll();
      if (resizeHandler) window.removeEventListener('resize', resizeHandler);
      if (galleryStateRef.current.container && clickHandler) galleryStateRef.current.container.removeEventListener('click', clickHandler);
      audioRef.current.pause();
      if (animateRef.current) cancelAnimationFrame(animateRef.current);
    };
  }, []);

  function setOnTimeUpdate(callback) {
    onTimeUpdateRef.current = callback;
  }

  function getAudioContext() { return audioContextRef.current; }
  function getAudioSource() { return audioSourceRef.current; }

  return {
    view, albums, selected, targetSelected, currentTrack, playing, seeking, seekValue, status,
    songTitle, songArtist, currentTime, duration, currentAlbum, currentTimeText, durationText,
    playerViewBg, gallery, isDarkMode, applyCamera, selectAlbum, openTrack, togglePlay, nextTrack,
    prevTrack, backToAlbums, onSeekInput, onSeekChange, getAudioContext, getAudioSource,
    fetchAlbums, renderGallery, initPlayer, setOnTimeUpdate,
  };
}