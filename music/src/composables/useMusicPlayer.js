import { computed, onBeforeUnmount, reactive, ref } from 'vue';
import * as THREE from 'three';
import { colorMix, formatTime, rgbToHex, shuffleArray } from '../utils/playerUtils';

export function useMusicPlayer() {
  const view = ref('albums');
  const albums = ref([]);
  const selected = ref(0);
  const targetSelected = ref(0);
  const currentTrack = ref(0);
  const playing = ref(false);
  const seeking = ref(false);
  const seekValue = ref(0);
  const status = ref('点击播放按钮开始');
  const songTitle = ref('请选择一个专辑');
  const songArtist = ref('这里显示当前歌曲名');
  const currentTime = ref(0);
  const duration = ref(0);
  const playerViewBg = ref('');
  const isDarkMode = ref(true);

  const gallery = reactive({ cam: 14.0, gap: 1.64, tilt: 3, speed: 0.32 });
  const coverCache = new Map();
  const audio = new Audio();
  audio.preload = 'metadata';
  audio.volume = 0.7;
  
  let audioContext = null;
  let audioSource = null;

  const galleryState = { scene: null, camera: null, renderer: null, group: null, cards: [], raycaster: new THREE.Raycaster(), pointer: new THREE.Vector2(), container: null };
  const playerState = { scene: null, camera: null, renderer: null, disc: null, sleeveCover: null, labelMesh: null, recordGroup: null, container: null, isSliding: false, slideProgress: 0, slideTarget: 0, sleeveGroup: null };
  const loader = new THREE.TextureLoader();

  const currentAlbum = computed(() => albums.value[selected.value] || null);
  const currentTimeText = computed(() => formatTime(currentTime.value));
  const durationText = computed(() => formatTime(duration.value));

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

  function setView(next) { view.value = next; }
  function syncPlay() { playing.value = !audio.paused && !audio.ended; }
  function applyCamera() { if (galleryState.camera) galleryState.camera.position.z = gallery.cam; renderGallery(); }
  function tex(src) { return new Promise((resolve, reject) => loader.load(src, (t) => { t.colorSpace = THREE.SRGBColorSpace; resolve(t); }, undefined, reject)); }

  async function resolveCover(album) {
    if (coverCache.has(album.title)) return coverCache.get(album.title);
    const cover = album.cover || defaultCover(album.title);
    coverCache.set(album.title, cover);
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

  async function guessThemeColor(cover) { return colorMix(cover ? await dominantColorFromImage(cover) : '#888888', '#000000', 0.15); }

  async function fetchAlbums() {
    const res = await fetch('/api/albums', { cache: 'no-store' });
    const data = await res.json();
    albums.value = shuffleArray(data.albums || []);
    if (albums.value.length) await selectAlbum(0, false);
    else { songTitle.value = '没有扫描到专辑'; songArtist.value = '请把每个专辑放进 `1` 文件夹下的子文件夹'; }
  }

  async function applyGalleryCover(index) {
    const album = albums.value[index]; if (!album || !galleryState.cards[index]) return;
    const cover = await resolveCover(album); const t = await tex(cover); const card = galleryState.cards[index];
    if (card.front.map) card.front.map.dispose?.(); card.front.map = t; card.front.needsUpdate = true;
  }

  function updateTrackInfo() {
    const album = currentAlbum.value; if (!album) return;
    const track = album.tracks[currentTrack.value];
    songTitle.value = track ? track.title : album.title; songArtist.value = album.title; status.value = '点击播放按钮开始';
    if (audio.duration) duration.value = audio.duration;
  }

  async function selectAlbum(index, openPlayer = false) { selected.value = index; targetSelected.value = index; currentTrack.value = 0; await applyGalleryCover(index); updateTrackInfo(); if (openPlayer) await openTrack(index, 0); }

  async function openTrack(albumIndex, trackIndex) {
    const album = albums.value[albumIndex]; if (!album) return;
    const track = album.tracks[trackIndex]; if (!track) return;
    selected.value = albumIndex; targetSelected.value = albumIndex; currentTrack.value = trackIndex;
    const cover = await resolveCover(album); audio.pause(); audio.src = track.file; audio.load(); songTitle.value = track.title; songArtist.value = album.title; status.value = '点击播放按钮开始'; setView('player'); syncPlay(); await applyPlayerCover(cover); await renderGallery();
    if (playerState.recordGroup) playerState.recordGroup.visible = true;
  }

  async function applyPlayerCover(src) {
    const t = await tex(src);
    t.wrapS = THREE.ClampToEdgeWrapping;
    t.wrapT = THREE.ClampToEdgeWrapping;
    if (playerState.sleeveCover) {
      playerState.sleeveCover.material.map = t;
      playerState.sleeveCover.material.needsUpdate = true;
    }
    if (playerState.labelMesh) {
      playerState.labelMesh.material.map = t;
      playerState.labelMesh.material.needsUpdate = true;
      playerState.labelMesh.material.transparent = false;
      playerState.labelMesh.material.opacity = 1.0;
    }
    extractAndApplyThemeColor(src);
  }

  // #region debug-point bg-1
  function extractAndApplyThemeColor(imgUrl) {
    // FIXED: Use the same background as other pages instead of album-based colors
    // This creates a consistent look across the entire application
    playerViewBg.value = 'linear-gradient(180deg, #0a0a0c 0%, #111114 100%)';
  }
  // #endregion debug-point bg-1

  function nextTrack() {
    const album = currentAlbum.value;
    if (!album) return;
    const nextTrackIdx = currentTrack.value + 1;
    if (nextTrackIdx < album.tracks.length) {
      openTrack(selected.value, nextTrackIdx).then(() => audio.play().catch(() => {}));
    } else {
      const nextAlbumIdx = (selected.value + 1) % albums.value.length;
      selected.value = nextAlbumIdx;
      currentAlbum.value = albums.value[nextAlbumIdx];
      openTrack(nextAlbumIdx, 0).then(() => audio.play().catch(() => {}));
    }
  }
  function prevTrack() {
    const album = currentAlbum.value;
    if (!album) return;
    const prevTrackIdx = currentTrack.value - 1;
    if (prevTrackIdx >= 0) {
      openTrack(selected.value, prevTrackIdx).then(() => audio.play().catch(() => {}));
    } else {
      const prevAlbumIdx = (selected.value - 1 + albums.value.length) % albums.value.length;
      selected.value = prevAlbumIdx;
      currentAlbum.value = albums.value[prevAlbumIdx];
      openTrack(prevAlbumIdx, currentAlbum.value.tracks.length - 1).then(() => audio.play().catch(() => {}));
    }
  }

  function initGallery(container) {
    galleryState.container = container;
    galleryState.scene = new THREE.Scene();
    galleryState.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    galleryState.camera.position.set(0, 0.4, gallery.cam);
    galleryState.camera.lookAt(0, 0.2, 0);
    // FIXED: Enable alpha channel for transparent background
    // This allows the CSS gradient background to show through
    galleryState.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    galleryState.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    galleryState.renderer.outputColorSpace = THREE.SRGBColorSpace;
    // FIXED: Set clear color to transparent so CSS background shows through
    galleryState.renderer.setClearColor(0x000000, 0);
    // FIXED: Disable auto clear to prevent black background
    galleryState.renderer.autoClear = false;
    // FIXED: Set canvas background style directly
    galleryState.renderer.domElement.style.background = 'linear-gradient(180deg, #0a0a0f 0%, #111114 100%)';
    container.appendChild(galleryState.renderer.domElement);

    // Clean lighting - no color tint
    galleryState.scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const key = new THREE.DirectionalLight(0xffffff, 1.8);
    key.position.set(5, 8, 6);
    galleryState.scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.4);
    fill.position.set(-4, -2, 4);
    galleryState.scene.add(fill);

    galleryState.group = new THREE.Group();
    galleryState.scene.add(galleryState.group);

    // Star field background
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
    galleryState.scene.add(stars);

    // Neon glow grid on floor
    const gridHelper = new THREE.GridHelper(80, 40, 0x00f3ff, 0x00f3ff);
    gridHelper.position.y = -10;
    gridHelper.material.opacity = 0.06;
    gridHelper.material.transparent = true;
    galleryState.scene.add(gridHelper);

    // FIXED: Set scene background to null to allow CSS gradient to show through
    // The canvas now has alpha: true, so the CSS background will be visible
    galleryState.scene.background = null;
  }

  function initPlayerScene(container) {
    playerState.container = container;
    playerState.scene = new THREE.Scene();
    playerState.camera = new THREE.PerspectiveCamera(32, 1.3, 0.1, 100);
    playerState.camera.position.set(0.8, 0.6, 7.8);
    playerState.camera.lookAt(0, -0.3, 0);
    // FIXED: Enable alpha channel for transparent background
    playerState.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    playerState.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    playerState.renderer.outputColorSpace = THREE.SRGBColorSpace;
    // FIXED: Set clear color to transparent so CSS background shows through
    playerState.renderer.setClearColor(0x000000, 0);
    // FIXED: Set canvas background style directly to match the page gradient
    playerState.renderer.domElement.style.background = 'linear-gradient(180deg, #0a0a0f 0%, #111114 100%)';
    container.appendChild(playerState.renderer.domElement);

    // Clean lighting - no color tint
    playerState.scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const d = new THREE.DirectionalLight(0xffffff, 1.5);
    d.position.set(4, 5, 6);
    playerState.scene.add(d);
    const fill = new THREE.DirectionalLight(0xffffff, 0.4);
    fill.position.set(-4, -1, 3);
    playerState.scene.add(fill);

    // Star field background
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
    playerState.scene.add(stars);

    // Neon glow grid on floor
    const gridHelper = new THREE.GridHelper(80, 40, 0x00f3ff, 0x00f3ff);
    gridHelper.position.y = -10;
    gridHelper.material.opacity = 0.06;
    gridHelper.material.transparent = true;
    playerState.scene.add(gridHelper);

    // Sleeve group with improved materials
    const sleeveGroup = new THREE.Group();
    playerState.scene.add(sleeveGroup);
    sleeveGroup.position.set(-2.0, 0.25, -0.5);
    sleeveGroup.rotation.y = 0.2;
    playerState.sleeveGroup = sleeveGroup;

    // FIXED: Set scene background to null to allow CSS gradient to show through
    playerState.scene.background = null;

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

    playerState.sleeveCover = new THREE.Mesh(
      new THREE.PlaneGeometry(5.2, 5.2),
      new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })
    );
    playerState.sleeveCover.position.z = sleeveThickness / 2 + 0.02;
    sleeveGroup.add(playerState.sleeveCover);

    const sleeveEdge = new THREE.Mesh(
      new THREE.BoxGeometry(5.5, 5.5, 0.02),
      new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.7, metalness: 0.1 })
    );
    sleeveEdge.position.z = sleeveThickness / 2;
    sleeveGroup.add(sleeveEdge);

    // Flaps with better styling
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

    // Record with enhanced visual effects
    const recordGroup = new THREE.Group();
    playerState.scene.add(recordGroup);
    playerState.disc = recordGroup;
    playerState.recordGroup = recordGroup;
    recordGroup.position.set(1.3, -0.15, -1.2);
    recordGroup.scale.setScalar(0.85);
    recordGroup.visible = true;

    // Main disc with subtle sheen
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

    // Groove lines with better definition
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

    // Outer edge with metallic shine
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

    // Inner edge
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

    // Label with cover image
    playerState.labelMesh = new THREE.Mesh(
      new THREE.CircleGeometry(1.17, 64),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.3,
        metalness: 0.1,
        transparent: true,
        opacity: 1.0
      })
    );
    playerState.labelMesh.position.z = 0.035;
    recordGroup.add(playerState.labelMesh);

    // Center hole
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

  async function renderGallery() {
    if (!galleryState.group) return;
    while (galleryState.group.children.length) galleryState.group.remove(galleryState.group.children[0]);
    galleryState.cards = [];
    const count = Math.max(albums.value.length, 1);
    for (let i = 0; i < count; i++) {
      const album = albums.value[i];
      const coverUrl = album ? await resolveCover(album) : defaultCover('MUSIC');
      const t = await tex(coverUrl);
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
      const delta = i - targetSelected.value;
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

      galleryState.group.add(wrap);
      galleryState.cards.push({ wrap, box, front: materials[4], glow, accent });
    }
  }

  function animate() {
    requestAnimationFrame(animate);
    if (galleryState.renderer) {
      selected.value += (targetSelected.value - selected.value) * 0.08;
      if (Math.abs(targetSelected.value - selected.value) < 0.001) selected.value = targetSelected.value;
      galleryState.cards.forEach((card, i) => {
        const delta = i - selected.value;
        const depth = Math.abs(delta);
        card.wrap.position.y = delta * -gallery.gap * 1.05;
        card.wrap.position.z = -depth * 0.28;
        card.wrap.rotation.x = THREE.MathUtils.degToRad(88 - gallery.tilt);
        card.wrap.rotation.z = THREE.MathUtils.degToRad(delta * -0.3);
        
        let cardScale = Math.max(0.88, 1 - depth * 0.035);
        if (depth < 0.5 && card.glow) {
          cardScale = Math.max(cardScale, 1.02);
        }
        card.wrap.scale.setScalar(cardScale);
        
        card.wrap.visible = depth < 20;
        
        if (card.glow) {
          const isSelected = depth < 0.5;
          const targetOpacity = isSelected ? 0.35 : 0;
          card.glow.material.opacity += (targetOpacity - card.glow.material.opacity) * 0.15;
          
          if (isSelected) {
            const pulse = Math.sin(Date.now() * 0.003) * 0.1 + 0.9;
            card.glow.scale.setScalar(1.02 * pulse);
          } else {
            card.glow.scale.setScalar(1.02);
          }
        }
      });
      galleryState.renderer.render(galleryState.scene, galleryState.camera);
    }
    if (playerState.renderer) {
      if (playerState.isSliding && playerState.recordGroup) {
        const targetProgress = playerState.slideTarget;
        const step = 0.025;
        if (playerState.slideProgress < targetProgress) {
          playerState.slideProgress = Math.min(playerState.slideProgress + step, targetProgress);
        } else if (playerState.slideProgress > targetProgress) {
          playerState.slideProgress = Math.max(playerState.slideProgress - step, targetProgress);
        }
        if (Math.abs(playerState.slideProgress - targetProgress) < 0.001) {
          playerState.slideProgress = targetProgress;
          playerState.isSliding = false;
        }
        // Smooth easing
        const eased = 1 - Math.pow(1 - playerState.slideProgress, 4);
        const startZ = -1.2;
        const endZ = 0.4;
        playerState.recordGroup.position.z = startZ + (endZ - startZ) * eased;
        playerState.recordGroup.rotation.y = eased * 0.45;
        if (playerState.sleeveGroup) {
          const sleeveEase = 1 - Math.pow(1 - Math.min(playerState.slideProgress * 1.5, 1), 4);
          playerState.sleeveGroup.rotation.y = 0.2 - sleeveEase * 0.15;
        }
      }
      // Smooth rotation when playing
      if (playerState.disc && playing.value) {
        playerState.disc.rotation.z += 0.004;
      }
      playerState.renderer.render(playerState.scene, playerState.camera);
    }
  }

  function onGalleryClick(event) {
    if (!albums.value.length) return;
    const rect = galleryState.container.getBoundingClientRect();
    galleryState.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    galleryState.pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
    galleryState.raycaster.setFromCamera(galleryState.pointer, galleryState.camera);
    const hits = galleryState.raycaster.intersectObjects(galleryState.group.children, true);
    if (!hits.length) return;
    let obj = hits[0].object;
    while (obj && !galleryState.cards.some((card) => card.wrap === obj)) obj = obj.parent;
    const idx = galleryState.cards.findIndex((card) => card.wrap === obj);
    if (idx >= 0) selectAlbum(idx, true);
  }

  function resize() {
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

  async function togglePlay() {
    if (!audio.src && currentAlbum.value) await openTrack(selected.value, currentTrack.value);
    if (audio.paused) {
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioSource = audioContext.createMediaElementSource(audio);
        audioSource.connect(audioContext.destination);
      }
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      if (playerState.recordGroup) {
        playerState.slideTarget = 1;
        playerState.isSliding = true;
      }
      try { await audio.play(); } catch { status.value = '浏览器阻止了播放，请再次点击'; }
    } else {
      audio.pause();
      if (playerState.recordGroup) {
        playerState.slideTarget = 0;
        playerState.isSliding = true;
      }
    }
  }
  
  function getAudioContext() { return audioContext; }
  function getAudioSource() { return audioSource; }
  function backToAlbums() { setView('albums'); }
  
  function toggleDarkMode() {
    isDarkMode.value = !isDarkMode.value;
    const root = document.documentElement;
    if (isDarkMode.value) {
      root.classList.remove('light-mode');
      root.classList.add('dark-mode');
    } else {
      root.classList.remove('dark-mode');
      root.classList.add('light-mode');
    }
  }

  function onSeekInput(e) {
    const newValue = parseFloat(e.target.value);
    if (!isNaN(newValue)) {
      seeking.value = true;
      seekValue.value = newValue;
      // 拖动时只更新 UI，不改变音频位置
    }
  }
  
  function onSeekChange(e) {
    const newValue = parseFloat(e.target.value);
    if (!isNaN(newValue) && Number.isFinite(audio.duration) && audio.duration > 0) {
      const newTime = audio.duration * (newValue / 1000);
      audio.currentTime = newTime;
      currentTime.value = newTime;
      seekValue.value = newValue;
    }
    seeking.value = false;
  }
  function wheelSelect(dir) { if (!albums.value.length) return; const next = Math.max(0, Math.min(albums.value.length - 1, Math.round(targetSelected.value + dir))); targetSelected.value = next; }

  function bindScroll() {
    let lock = false;
    const onWheel = (e) => { if (view.value !== 'albums') return; e.preventDefault(); if (lock) return; lock = true; wheelSelect(e.deltaY > 0 ? 1 : -1); setTimeout(() => { lock = false; }, 160); };
    const onTouchStart = (e) => { onTouchStart.startY = e.touches[0].clientY; };
    const onTouchMove = (e) => { if (view.value !== 'albums' || onTouchStart.startY === null) return; const dy = onTouchStart.startY - e.touches[0].clientY; if (Math.abs(dy) > 24) { wheelSelect(dy > 0 ? 1 : -1); onTouchStart.startY = e.touches[0].clientY; } };
    onTouchStart.startY = null;
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    return () => { window.removeEventListener('wheel', onWheel); window.removeEventListener('touchstart', onTouchStart); window.removeEventListener('touchmove', onTouchMove); };
  }

  function addAudioEvents() {
    audio.addEventListener('timeupdate', () => {
      if (!seeking.value) {
        seekValue.value = (audio.currentTime / Math.max(audio.duration || 1, 1)) * 1000;
        currentTime.value = audio.currentTime;
      }
      if (audio.duration) duration.value = audio.duration;
      if (onTimeUpdate) onTimeUpdate();
    });
    audio.addEventListener('loadedmetadata', () => { duration.value = audio.duration; });
    audio.addEventListener('play', () => { playing.value = true; syncPlay(); status.value = '正在播放'; });
    audio.addEventListener('pause', () => { playing.value = false; syncPlay(); status.value = '已暂停'; });
    audio.addEventListener('ended', nextTrack);
    audio.addEventListener('error', () => { status.value = '音频加载失败，请检查文件格式或路径'; });
  }

  let cleanupScroll = null;
  let resizeHandler = null;
  let clickHandler = null;

  async function initPlayer(galleryContainer, playerContainer) {
    if (galleryContainer && playerContainer) {
      initGallery(galleryContainer);
      initPlayerScene(playerContainer);
      addAudioEvents();
      cleanupScroll = bindScroll();
      await fetchAlbums();
      await renderGallery();
      animate();
      resizeHandler = () => resize();
      clickHandler = (e) => onGalleryClick(e);
      window.addEventListener('resize', resizeHandler);
      galleryContainer.addEventListener('click', clickHandler);
      resize();
    }
  }

  onBeforeUnmount(() => {
    if (cleanupScroll) cleanupScroll();
    if (resizeHandler) window.removeEventListener('resize', resizeHandler);
    if (galleryState.container && clickHandler) galleryState.container.removeEventListener('click', clickHandler);
    audio.pause();
  });

  let onTimeUpdate = null;
  function setOnTimeUpdate(callback) { onTimeUpdate = callback; }

  return {
    view, albums, selected, targetSelected, currentTrack, playing, seeking, seekValue, status, songTitle, songArtist,
    currentTime, duration, currentAlbum, currentTimeText, durationText, playerViewBg, gallery, isDarkMode,
    applyCamera, selectAlbum, openTrack, togglePlay, nextTrack, prevTrack, backToAlbums, onSeekInput, onSeekChange, toggleDarkMode, getAudioContext, getAudioSource, fetchAlbums, renderGallery, initPlayer, setOnTimeUpdate,
  };
}