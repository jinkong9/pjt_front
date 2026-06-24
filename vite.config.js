import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

const backendOrigin =
  process.env.VITE_BACKEND_ORIGIN || 'http://localhost:8080'

// https://vite.dev/config/
export default defineConfig({
  envPrefix: ['VITE_', 'OPENAPI_'],
  plugins: [vue(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: backendOrigin,
        changeOrigin: true,
      },
      '/uploads': {
        target: backendOrigin,
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
