export function formatTime(sec) {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = String(Math.floor(sec % 60)).padStart(2, '0');
  return `${m}:${s}`;
}

export function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
}

export function colorMix(hex, mix = '#ffffff', amount = 0.18) {
  const h = hex.replace('#', '');
  const m = mix.replace('#', '');
  const a = parseInt(h.slice(0, 2), 16);
  const b = parseInt(h.slice(2, 4), 16);
  const c = parseInt(h.slice(4, 6), 16);
  const x = parseInt(m.slice(0, 2), 16);
  const y = parseInt(m.slice(2, 4), 16);
  const z = parseInt(m.slice(4, 6), 16);
  return rgbToHex(a * (1 - amount) + x * amount, b * (1 - amount) + y * amount, c * (1 - amount) + z * amount);
}

export function getContrastColor(hex) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#1a1a1a' : '#f5f5f5';
}
