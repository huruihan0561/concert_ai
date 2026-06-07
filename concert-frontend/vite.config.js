import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  base: '/concert/',  // ✅ 移到顶层，和 plugins 平级
  resolve: {
    alias: {
      events: path.resolve(__dirname, 'node_modules/events/events.js'),
    },
  },
  optimizeDeps: {
    include: ['events', 'sockjs-client', '@stomp/stompjs'],
  },
  server: {
    port: 5175,
    historyApiFallback: true,
    proxy: {
      '/music/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/music/, ''),
      },
      '/music/1': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/music/, ''),
      },
      '/music/index.html': {
        target: 'http://localhost:5176',
        changeOrigin: true,
        rewrite: (path) => path,
      },
      '/music/@id': {
        target: 'http://localhost:5176',
        changeOrigin: true,
        rewrite: (path) => path,
      },
      '/music/@vite': {
        target: 'http://localhost:5176',
        changeOrigin: true,
        rewrite: (path) => path,
      },
      '/music/src': {
        target: 'http://localhost:5176',
        changeOrigin: true,
        rewrite: (path) => path,
      },
      '/music/node_modules': {
        target: 'http://localhost:5176',
        changeOrigin: true,
        rewrite: (path) => path,
      },
      '/api/albums': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      },
      '/1': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      },
      '/concert/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/concert/, ''),
      },
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
      '/ws': {
        target: 'http://localhost:8081',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // base: '/concert/',  // ❌ 删除这里的 base
  },
})