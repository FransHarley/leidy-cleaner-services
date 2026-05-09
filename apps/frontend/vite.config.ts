import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const previewAllowedHosts = [
  'wholesome-emotion-production.up.railway.app',
  'cleanerleidy.com.br',
  'www.cleanerleidy.com.br',
];

export default defineConfig({
  plugins: [react()],
  server: {
    port: Number(process.env.FRONTEND_PORT ?? 5173),
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    allowedHosts: previewAllowedHosts,
  },
});