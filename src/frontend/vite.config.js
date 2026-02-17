import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: ['.arq-ai.ru', 'arq-ai.ru'],
    proxy: {
      '/api/v1': {
        target: 'http://arq:8000',
        changeOrigin: true,
      }
    }
  }
})
