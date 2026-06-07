<template>
  <div class="app">
    <AlbumWall
      ref="albumWallRef"
      :view="view"
      :albums="albums"
      :gallery="gallery"
      :isDarkMode="isDarkMode"
      :applyCamera="applyCamera"
      :renderGallery="renderGallery"
      :toggleDarkMode="toggleDarkMode"
    />
    <PlayerPanel
      ref="playerPanelRef"
      :view="view"
      :currentAlbum="currentAlbum"
      :songTitle="songTitle"
      :songArtist="songArtist"
      :playing="playing"
      :currentTimeText="currentTimeText"
      :durationText="durationText"
      :status="status"
      :seekValue="seekValue"
      :playerViewStyle="{ background: playerViewBg || undefined }"
      :togglePlay="togglePlay"
      :nextTrack="nextTrack"
      :prevTrack="prevTrack"
      :backToAlbums="backToAlbums"
      :onSeekInput="onSeekInput"
      :onSeekChange="onSeekChange"
      :getAudioContext="getAudioContext"
      :getAudioSource="getAudioSource"
    />
  </div>
</template>

<script setup>import { nextTick, onMounted, ref, watch } from 'vue';
import AlbumWall from './components/AlbumWall.vue';
import PlayerPanel from './components/PlayerPanel.vue';
import { useMusicPlayer } from './composables/useMusicPlayer';
const albumWallRef = ref(null);
const playerPanelRef = ref(null);
const hasPlayed = ref(false);
const {
  view,
  albums,
  gallery,
  currentAlbum,
  songTitle,
  songArtist,
  playing,
  currentTimeText,
  durationText,
  status,
  seekValue,
  playerViewBg,
  applyCamera,
  renderGallery,
  togglePlay,
  nextTrack,
  prevTrack,
  backToAlbums,
  onSeekInput,
  onSeekChange,
  initPlayer,
  setOnTimeUpdate,
} = useMusicPlayer();

function sendPlayerState() {
  if (currentAlbum.value) {
    const state = {
      type: 'playerState',
      playing: playing.value,
      songTitle: songTitle.value,
      songArtist: songArtist.value,
      cover: currentAlbum.value.cover,
      duration: durationText.value,
      currentTime: currentTimeText.value,
      hasPlayed: hasPlayed.value,
    };
    window.parent.postMessage(state, '*');
  }
}

watch(playing, (newVal) => {
  if (newVal) {
    hasPlayed.value = true;
  }
});

watch([playing, songTitle, songArtist, currentAlbum, currentTimeText, durationText], () => {
  sendPlayerState();
}, { deep: true });

onMounted(async () => {
 await nextTick();
 await initPlayer(albumWallRef.value?.canvasContainer, playerPanelRef.value?.canvasContainer);
 setOnTimeUpdate(sendPlayerState);

 window.addEventListener('message', (event) => {
   if (event.data.type === 'togglePlay') {
     togglePlay();
   } else if (event.data.type === 'nextTrack') {
     nextTrack();
   } else if (event.data.type === 'prevTrack') {
     prevTrack();
   }
 });
});
</script>
