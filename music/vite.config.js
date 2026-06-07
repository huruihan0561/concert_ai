import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  base: '/music/',
  server: {
    port: 5176,
    cors: true,
    proxy: {
      '/api': 'http://localhost:3002',
      '/1': 'http://localhost:3002',
    },
  },
});
