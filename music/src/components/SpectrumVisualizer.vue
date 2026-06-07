<template>
  <div class="spectrum-container">
    <canvas ref="canvasRef" class="spectrum-canvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';

const props = defineProps({
  audioContext: { type: AudioContext, default: null },
  source: { type: MediaElementAudioSourceNode, default: null },
  playing: { type: Boolean, default: false },
});

const canvasRef = ref(null);
let animationId = null;
let analyzer = null;
let dataArray = null;
let barWidth = 0;

onMounted(() => {
  initAnalyzer();
});

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  if (analyzer) {
    analyzer.disconnect();
  }
});

watch(() => props.source, (newSource) => {
  if (newSource && props.audioContext) {
    setupAnalyzer(newSource);
  }
});

function drawRoundedRect(ctx, x, y, width, height, radius) {
  if (width < 2 * radius) radius = width / 2;
  if (height < 2 * radius) radius = height / 2;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function initAnalyzer() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const container = canvas.parentElement;
  
  function resize() {
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    barWidth = Math.max(3, canvas.width / 64);
  }
  
  resize();
  window.addEventListener('resize', resize);
  
  function draw() {
    if (!analyzer || !dataArray) {
      drawEmpty();
      animationId = requestAnimationFrame(draw);
      return;
    }
    
    analyzer.getByteFrequencyData(dataArray);
    
    // FIXED: Use transparent background instead of black to show CSS gradient
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.3)');
    gradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.5)');
    gradient.addColorStop(1, 'rgba(168, 85, 247, 0.8)');
    
    const bars = Math.floor(canvas.width / barWidth);
    const sliceSize = Math.floor(dataArray.length / bars);
    
    for (let i = 0; i < bars; i++) {
      let sum = 0;
      for (let j = 0; j < sliceSize; j++) {
        sum += dataArray[i * sliceSize + j];
      }
      const avg = sum / sliceSize;
      const barHeight = (avg / 255) * canvas.height * 0.8;
      const x = i * barWidth;
      const y = canvas.height - barHeight;
      
      ctx.fillStyle = gradient;
      drawRoundedRect(ctx, x, y, barWidth - 2, barHeight, 2);
      ctx.fill();
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      drawRoundedRect(ctx, x, y, barWidth - 2, barHeight * 0.3, 2);
      ctx.fill();
    }
    
    animationId = requestAnimationFrame(draw);
  }
  
  function drawEmpty() {
    // FIXED: Use transparent background instead of black to show CSS gradient
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const bars = Math.floor(canvas.width / barWidth);
    for (let i = 0; i < bars; i++) {
      const x = i * barWidth;
      const h = canvas.height * (0.1 + Math.sin(Date.now() * 0.002 + i * 0.5) * 0.05);
      ctx.fillStyle = 'rgba(99, 102, 241, 0.15)';
      drawRoundedRect(ctx, x, canvas.height - h, barWidth - 2, h, 2);
      ctx.fill();
    }
  }
  
  draw();
}

function setupAnalyzer(source) {
  if (!props.audioContext) return;
  
  if (analyzer) {
    analyzer.disconnect();
  }
  
  analyzer = props.audioContext.createAnalyser();
  analyzer.fftSize = 256;
  dataArray = new Uint8Array(analyzer.frequencyBinCount);
  
  source.connect(analyzer);
}

defineExpose({ setupAnalyzer });
</script>

<style scoped>
.spectrum-container {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 80px;
  pointer-events: none;
  overflow: hidden;
}

.spectrum-canvas {
  width: 100%;
  height: 100%;
}
</style>