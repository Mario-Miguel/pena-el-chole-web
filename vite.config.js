import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  logLevel: 'error',
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // Backend Spring Boot en local
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
});
