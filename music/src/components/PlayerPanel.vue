<template>
  <section id="playerView" class="view" :class="{ active: view === 'player' }" :style="playerViewStyle">
    <div ref="canvasContainer" id="playerCanvas"></div>
    <SpectrumVisualizer
      :audioContext="audioContext"
      :source="audioSource"
      :playing="playing"
    />
    <div class="player-controls">
      <div class="song-info">
        <h2 class="song-title">{{ songTitle }}</h2>
        <p class="song-artist">{{ songArtist }}</p>
      </div>
      <div class="player-buttons">
        <button class="control-btn" @click="prevTrack" title="上一曲">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 6h2v12H6zM9.5 12l8.5 6V6z"/>
          </svg>
        </button>
        <button class="control-btn play-btn" @click="togglePlay" title="播放/暂停">
          <svg v-if="!playing" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
          <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 4h4v16H6zM14 4h4v16h-4z"/>
          </svg>
        </button>
        <button class="control-btn" @click="nextTrack" title="下一曲">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6z"/>
          </svg>
        </button>
      </div>
      <div class="player-seek">
        <span class="seek-time">{{ currentTimeText }}</span>
        <div class="seek-track">
          <div class="seek-progress" :style="{ width: `${seekValue / 10}%` }"></div>
          <input
            :value="seekValue"
            class="seek-bar"
            type="range"
            min="0"
            max="1000"
            @input="onSeekInput"
            @change="onSeekChange"
          />
        </div>
        <span class="seek-time">{{ durationText }}</span>
      </div>

    </div>
    <button class="back" @click="backToAlbums">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;">
        <path d="M19 12H5M12 19l-7-7 7-7"/>
      </svg>
      返回专辑墙
    </button>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue';
import SpectrumVisualizer from './SpectrumVisualizer.vue';

const props = defineProps({
  view: { type: String, required: true },
  currentAlbum: { type: Object, default: null },
  songTitle: { type: String, required: true },
  songArtist: { type: String, required: true },
  playing: { type: Boolean, required: true },
  currentTimeText: { type: String, required: true },
  durationText: { type: String, required: true },
  status: { type: String, required: true },
  seekValue: { type: Number, required: true },
  playerViewStyle: { type: Object, default: () => ({}) },
  togglePlay: { type: Function, required: true },
  nextTrack: { type: Function, required: true },
  prevTrack: { type: Function, required: true },
  backToAlbums: { type: Function, required: true },
  onSeekInput: { type: Function, required: true },
  onSeekChange: { type: Function, required: true },
  getAudioContext: { type: Function, default: () => null },
  getAudioSource: { type: Function, default: () => null },
});

const audioContext = computed(() => props.getAudioContext?.());
const audioSource = computed(() => props.getAudioSource?.());

const canvasContainer = ref(null);
defineExpose({ canvasContainer });
</script>