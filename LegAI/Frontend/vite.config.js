import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // Đổi cổng thành 3000
    proxy: {
      '/api': 'http://localhost:8000', // Giữ nguyên proxy cho backend
      '/get-link-info': {
        target: 'https://jasper-lilac-van.glitch.me',
        changeOrigin: true,
        rewrite: (path) => path
      }
    }
  }
});