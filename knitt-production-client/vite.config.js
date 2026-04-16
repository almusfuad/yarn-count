import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true,
      }
    }
  },
  preview: {
    port: 3100,
    proxy: {
      '/api': {
        target: 'http://knit-production-backend-main:5000',
        changeOrigin: true,
        ws: true,
      }
    }
  }
});
