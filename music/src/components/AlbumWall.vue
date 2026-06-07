<template>
  <section id="albumsView" class="view" :class="{ active: view === 'albums' }">
    <div ref="canvasContainer" id="albumsCanvas"></div>
  </section>
</template>

<script setup>
import { ref } from 'vue';

defineProps({
  view: { type: String, required: true },
  albums: { type: Array, required: true },
  gallery: { type: Object, required: true },
  isDarkMode: { type: Boolean, default: true },
  applyCamera: { type: Function, required: true },
  renderGallery: { type: Function, required: true },
  toggleDarkMode: { type: Function, default: () => {} },
});

const canvasContainer = ref(null);
defineExpose({ canvasContainer });
</script>
