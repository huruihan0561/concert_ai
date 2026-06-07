<template>
  <div class="app">
    <section id="albumsView" class="view" :class="{ active: view === 'albums' }">
      <div class="topbar">
        <b>Album Wall</b>
        <span>{{ albums.length }} albums</span>
      </div>
      <div class="hint">上下滑动 / 鼠标滚轮 切换专辑，点击封面进入</div>
      <div ref="albumsCanvasEl" id="albumsCanvas"></div>

    </section>

    <section id="playerView" class="view" :class="{ active: view === 'player' }">
      <div ref="playerCanvasEl" id="playerCanvas"></div>
      <div class="player-controls">
        <div class="song-info">
          <h2 class="song-title">{{ songTitle }}</h2>
          <p class="song-artist">{{ songArtist }}</p>
        </div>
        <div class="player-buttons">
          <button class="control-btn" @click="prevTrack">⟨⟨</button>
          <button class="control-btn play-btn" @click="togglePlay">{{ playing ? '❚❚' : '▶' }}</button>
          <button class="control-btn" @click="nextTrack">⟩⟩</button>
        </div>
        <div class="player-seek">
          <span class="seek-time">{{ currentTimeText }}</span>
          <input :value="seekValue" class="seek-bar" type="range" min="0" max="1000" @input="seekValue = Number($event.target.value); onSeekInput()" @change="onSeekChange" />
          <span class="seek-time">{{ durationText }}</span>
        </div>

      </div>
      <button class="back" @click="backToAlbums">← 返回专辑墙</button>
    </section>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import * as THREE from 'three';
import jsmediatags from '/node_modules/jsmediatags/dist/jsmediatags.min.js';
import { colorMix, formatTime, rgbToHex, shuffleArray } from '../utils/playerUtils';

const albumsCanvasEl = ref(null);
const playerCanvasEl = ref(null);
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
const coverCache = new Map();

const gallery = reactive({ cam: 16.3, gap: 1.68, tilt: 14, speed: 0.26 });
const audio = new Audio();
audio.preload = 'metadata';

const galleryState = { scene: null, camera: null, renderer: null, group: null, cards: [], raycaster: new THREE.Raycaster(), pointer: new THREE.Vector2() };
const playerState = { scene: null, camera: null, renderer: null, disc: null, sleeveCover: null, labelMesh: null, recordGroup: null };
const loader = new THREE.TextureLoader();

const currentAlbum = computed(() => albums.value[selected.value] || null);
const currentTimeText = computed(() => formatTime(currentTime.value));
const durationText = computed(() => formatTime(duration.value));

function defaultCover(label = 'MUSIC') {
  const canvas = document.createElement('canvas');
  canvas.width = 900; canvas.height = 900;
  const ctx = canvas.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 900, 900);
  g.addColorStop(0, '#8b4dff');
  g.addColorStop(1, '#10131d');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 900, 900);
  ctx.fillStyle = 'rgba(255,255,255,.1)';
  for (let i = 0; i < 14; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * 900, Math.random() * 900, 18 + Math.random() * 80, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,255,255,.95)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '800 76px Inter, sans-serif';
  ctx.fillText(label, 450, 450);
  return canvas.toDataURL('image/png');
}

function setView(next) { view.value = next; }
function syncPlay() { playing.value = !audio.paused && !audio.ended; }
function applyCamera() { if (galleryState.camera) galleryState.camera.position.z = gallery.cam; renderGallery(); }

function tex(src) { return new Promise((resolve, reject) => loader.load(src, (t) => { t.colorSpace = THREE.SRGBColorSpace; resolve(t); }, undefined, reject)); }

async function readInnerCover(file) {
  try {
    const res = await fetch(file, { cache: 'no-store' });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    return await new Promise((resolve) => {
      jsmediatags.read(buf, {
        onSuccess: (tag) => {
          const pic = tag?.tags?.picture;
          if (pic?.data && pic?.format) {
            const bytes = new Uint8Array(pic.data);
            let bin = '';
            for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
            resolve(`data:${pic.format};base64,${btoa(bin)}`);
          } else resolve(null);
        },
        onError: () => resolve(null),
      });
    });
  } catch { return null; }
}

async function resolveCover(album) {
  if (coverCache.has(album.title)) return coverCache.get(album.title);
  const inner = album.tracks.length ? await readInnerCover(album.tracks[0].file) : null;
  const cover = inner || album.cover || defaultCover(album.title);
  coverCache.set(album.title, cover);
  return cover;
}

async function dominantColorFromImage(src) {
  return await new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 24; canvas.height = 24;
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
  const dom = cover ? await dominantColorFromImage(cover) : '#888888';
  return colorMix(dom, '#000000', 0.15);
}

async function fetchAlbums() {
  const res = await fetch('/api/albums', { cache: 'no-store' });
  const data = await res.json();
  albums.value = shuffleArray(data.albums || []);
  if (albums.value.length) await selectAlbum(0, false);
  else {
    songTitle.value = '没有扫描到专辑';
    songArtist.value = '请把每个专辑放进 `1` 文件夹下的子文件夹';
  }
}

async function applyGalleryCover(index) {
  const album = albums.value[index];
  if (!album || !galleryState.cards[index]) return;
  const cover = await resolveCover(album);
  const t = await tex(cover);
  const card = galleryState.cards[index];
  if (card.front.map) card.front.map.dispose?.();
  card.front.map = t;
  card.front.needsUpdate = true;
}

async function selectAlbum(index, openPlayer = false) {
  selected.value = index;
  targetSelected.value = index;
  currentTrack.value = 0;
  await applyGalleryCover(index);
  updateTrackInfo();
  if (openPlayer) await openTrack(index, 0);
}

function updateTrackInfo() {
  const album = currentAlbum.value;
  if (!album) return;
  const track = album.tracks[currentTrack.value];
  songTitle.value = track ? track.title : album.title;
  songArtist.value = album.title;
  status.value = '点击播放按钮开始';
  if (audio.duration) duration.value = audio.duration;
}

async function openTrack(albumIndex, trackIndex) {
  const album = albums.value[albumIndex];
  if (!album) return;
  const track = album.tracks[trackIndex];
  if (!track) return;
  selected.value = albumIndex;
  targetSelected.value = albumIndex;
  currentTrack.value = trackIndex;
  const cover = await resolveCover(album);
  audio.pause();
  audio.src = track.file;
  audio.load();
  songTitle.value = track.title;
  songArtist.value = album.title;
  status.value = '点击播放按钮开始';
  setView('player');
  syncPlay();
  await applyPlayerCover(cover);
  await renderGallery();
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
  }
  extractAndApplyThemeColor(src);
}

function extractAndApplyThemeColor(imgUrl) {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = function () {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 100; canvas.height = 100;
    ctx.drawImage(img, 0, 0, 100, 100);
    const pixels = ctx.getImageData(0, 0, 100, 100).data;
    let r = 0, g = 0, b = 0, count = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      const pr = pixels[i], pg = pixels[i + 1], pb = pixels[i + 2];
      const brightness = (pr * 299 + pg * 587 + pb * 114) / 1000;
      if (brightness > 30 && brightness < 220) { r += pr; g += pg; b += pb; count++; }
    }
    if (count > 0) {
      r = Math.round(r / count); g = Math.round(g / count); b = Math.round(b / count);
      const darkerR = Math.max(0, Math.round(r * 0.4));
      const darkerG = Math.max(0, Math.round(g * 0.4));
      const darkerB = Math.max(0, Math.round(b * 0.4));
      const playerView = document.getElementById('playerView');
      if (playerView) {
        playerView.style.background = `radial-gradient(circle at 50% 50%, rgb(${Math.round(r * 0.35)}, ${Math.round(g * 0.35)}, ${Math.round(b * 0.35)}) 0%, rgb(${Math.round(r * 0.2)}, ${Math.round(g * 0.2)}, ${Math.round(b * 0.2)}) 40%, rgb(${darkerR}, ${darkerG}, ${darkerB}) 100%)`;
      }
    }
  };
  img.src = imgUrl;
}

function nextTrack() {
  const album = currentAlbum.value;
  if (!album) return;
  openTrack(selected.value, (currentTrack.value + 1) % album.tracks.length).then(() => playing.value && audio.play().catch(() => {}));
}

function prevTrack() {
  const album = currentAlbum.value;
  if (!album) return;
  openTrack(selected.value, (currentTrack.value - 1 + album.tracks.length) % album.tracks.length).then(() => playing.value && audio.play().catch(() => {}));
}

function initGallery() {
  galleryState.scene = new THREE.Scene();
  galleryState.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  galleryState.camera.position.set(0, 0.4, gallery.cam);
  galleryState.camera.lookAt(0, 0.2, 0);
  galleryState.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  galleryState.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  galleryState.renderer.outputColorSpace = THREE.SRGBColorSpace;
  albumsCanvasEl.value.appendChild(galleryState.renderer.domElement);
  galleryState.scene.add(new THREE.AmbientLight(0xffffff, 1.45));
  const key = new THREE.DirectionalLight(0xffffff, 2.5); key.position.set(3, 6, 5); galleryState.scene.add(key);
  const fill = new THREE.DirectionalLight(0xffffff, 0.8); fill.position.set(-4, -1, 2); galleryState.scene.add(fill);
  galleryState.group = new THREE.Group(); galleryState.scene.add(galleryState.group);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ color: 0x121212, roughness: 1, metalness: 0 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -5.2;
  galleryState.scene.add(floor);
  galleryState.scene.background = new THREE.Color(0x121212);
}

function initPlayer() {
  playerState.scene = new THREE.Scene();
  playerState.camera = new THREE.PerspectiveCamera(32, 1.3, 0.1, 100);
  playerState.camera.position.set(0.8, 0.6, 7.8);
  playerState.camera.lookAt(0, -0.3, 0);
  playerState.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  playerState.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  playerState.renderer.outputColorSpace = THREE.SRGBColorSpace;
  playerCanvasEl.value.appendChild(playerState.renderer.domElement);
  playerState.scene.add(new THREE.AmbientLight(0xffffff, 1.5));
  const d = new THREE.DirectionalLight(0xffffff, 2.2); d.position.set(4, 5, 6); playerState.scene.add(d);
  const fill = new THREE.DirectionalLight(0xffffff, 0.8); fill.position.set(-4, -1, 3); playerState.scene.add(fill);
  const sleeveGroup = new THREE.Group();
  playerState.scene.add(sleeveGroup);
  sleeveGroup.position.set(-2.0, 0.25, -0.5);
  sleeveGroup.rotation.y = 0.2;
  const sleeve = new THREE.Mesh(new THREE.BoxGeometry(5.5, 5.5, 0.15), new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9, metalness: 0 }));
  sleeve.position.z = -0.075;
  sleeveGroup.add(sleeve);
  playerState.sleeveCover = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 5.2), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0 }));
  playerState.sleeveCover.position.z = 0.02;
  sleeveGroup.add(playerState.sleeveCover);
  const recordGroup = new THREE.Group();
  playerState.scene.add(recordGroup);
  playerState.disc = recordGroup;
  playerState.recordGroup = recordGroup;
  recordGroup.position.set(1.3, -0.15, 0.25);
  recordGroup.scale.setScalar(0.85);
  recordGroup.visible = false;
  const discBase = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 0.045, 128), new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.2, metalness: 0.12 }));
  discBase.rotation.x = Math.PI / 2;
  recordGroup.add(discBase);
  const grooves = new THREE.Mesh(new THREE.CircleGeometry(2.47, 128), new THREE.MeshBasicMaterial({ color: 0x111111 }));
  grooves.position.z = 0.025;
  recordGroup.add(grooves);
  const labelBase = new THREE.Mesh(new THREE.CircleGeometry(1.2, 64), new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.7, metalness: 0.05 }));
  labelBase.position.z = 0.032;
  recordGroup.add(labelBase);
  playerState.labelMesh = new THREE.Mesh(new THREE.CircleGeometry(1.15, 64), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  playerState.labelMesh.position.z = 0.035;
  recordGroup.add(playerState.labelMesh);
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
      new THREE.MeshStandardMaterial({ color: new THREE.Color(accent).multiplyScalar(0.65), roughness: 0.9, metalness: 0.02 }),
      new THREE.MeshStandardMaterial({ color: new THREE.Color(accent).multiplyScalar(0.65), roughness: 0.9, metalness: 0.02 }),
      new THREE.MeshStandardMaterial({ color: new THREE.Color(accent).multiplyScalar(0.78), roughness: 0.92, metalness: 0.02 }),
      new THREE.MeshStandardMaterial({ color: new THREE.Color(accent).multiplyScalar(0.78), roughness: 0.92, metalness: 0.02 }),
      new THREE.MeshBasicMaterial({ map: t }),
      new THREE.MeshBasicMaterial({ map: t }),
    ];
    const wrap = new THREE.Group();
    const delta = i - targetSelected.value;
    const depth = Math.abs(delta);
    wrap.position.set(0, delta * -gallery.gap * 0.95, -depth * 0.15);
    wrap.rotation.x = THREE.MathUtils.degToRad(88 - gallery.tilt);
    wrap.rotation.z = THREE.MathUtils.degToRad(delta * -0.3);
    wrap.scale.setScalar(Math.max(0.9, 1 - depth * 0.03));
    wrap.visible = depth < 20;
    const box = new THREE.Mesh(new THREE.BoxGeometry(7.1, 8.16, 0.18), materials);
    wrap.add(box);
    galleryState.group.add(wrap);
    galleryState.cards.push({ wrap, box, front: materials[4] });
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
      card.wrap.scale.setScalar(Math.max(0.9, 1 - depth * 0.03));
      card.wrap.visible = depth < 20;
    });
    galleryState.renderer.render(galleryState.scene, galleryState.camera);
  }
  if (playerState.renderer) {
    if (playerState.disc && playing.value) playerState.disc.rotation.z += 0.003;
    playerState.renderer.render(playerState.scene, playerState.camera);
  }
}

function onGalleryClick(event) {
  if (!albums.value.length) return;
  const rect = albumsCanvasEl.value.getBoundingClientRect();
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
  if (!galleryState.renderer || !playerState.renderer) return;
  const albumsWidth = albumsCanvasEl.value.clientWidth;
  const albumsHeight = albumsCanvasEl.value.clientHeight;
  galleryState.renderer.setSize(albumsWidth, albumsHeight);
  galleryState.camera.aspect = albumsWidth / albumsHeight;
  galleryState.camera.updateProjectionMatrix();
  const playerWidth = playerCanvasEl.value.clientWidth;
  const playerHeight = playerCanvasEl.value.clientHeight;
  playerState.renderer.setSize(playerWidth, playerHeight);
  playerState.camera.aspect = playerWidth / playerHeight;
  playerState.camera.updateProjectionMatrix();
}

async function togglePlay() {
  if (!audio.src && currentAlbum.value) await openTrack(selected.value, currentTrack.value);
  if (audio.paused) {
    try { await audio.play(); } catch { status.value = '浏览器阻止了播放，请再次点击'; }
  } else {
    audio.pause();
  }
}

function backToAlbums() { setView('albums'); }
function onSeekInput() { seeking.value = true; currentTime.value = (audio.duration || 0) * (seekValue.value / 1000); }
function onSeekChange() { if (audio.duration) audio.currentTime = audio.duration * (seekValue.value / 1000); seeking.value = false; }

function wheelSelect(dir) {
  if (!albums.value.length) return;
  const next = Math.max(0, Math.min(albums.value.length - 1, Math.round(targetSelected.value + dir)));
  targetSelected.value = next;
}

function bindScroll() {
  let lock = false;
  window.addEventListener('wheel', (e) => {
    if (view.value !== 'albums') return;
    e.preventDefault();
    if (lock) return;
    lock = true;
    wheelSelect(e.deltaY > 0 ? 1 : -1);
    setTimeout(() => { lock = false; }, 160);
  }, { passive: false });
  let startY = null;
  window.addEventListener('touchstart', (e) => { startY = e.touches[0].clientY; }, { passive: true });
  window.addEventListener('touchmove', (e) => {
    if (view.value !== 'albums' || startY === null) return;
    const dy = startY - e.touches[0].clientY;
    if (Math.abs(dy) > 24) {
      wheelSelect(dy > 0 ? 1 : -1);
      startY = e.touches[0].clientY;
    }
  }, { passive: true });
}

function addAudioEvents() {
  audio.addEventListener('timeupdate', () => {
    if (!seeking.value) seekValue.value = String((audio.currentTime / Math.max(audio.duration || 1, 1)) * 1000);
    currentTime.value = audio.currentTime;
    if (audio.duration) duration.value = audio.duration;
  });
  audio.addEventListener('loadedmetadata', () => { duration.value = audio.duration; });
  audio.addEventListener('play', () => { playing.value = true; syncPlay(); status.value = '播放中'; });
  audio.addEventListener('pause', () => { playing.value = false; syncPlay(); status.value = '已暂停'; });
  audio.addEventListener('ended', nextTrack);
  audio.addEventListener('error', () => { status.value = '音频加载失败，请检查文件格式或路径'; });
}

onMounted(async () => {
  initGallery();
  initPlayer();
  addAudioEvents();
  bindScroll();
  await fetchAlbums();
  await renderGallery();
  animate();
  window.addEventListener('resize', resize);
  albumsCanvasEl.value.addEventListener('click', onGalleryClick);
  resize();
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', resize);
  audio.pause();
});
</script>
