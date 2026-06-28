import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'POS System',
        short_name: 'POS',
        theme_color: '#0D0D0D',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      devOptions: { enabled: true },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        navigateFallback: '/',
        runtimeCaching: [
          {
            urlPattern: /\/api\/products/,
            handler: 'NetworkFirst',
            options: { cacheName: 'products-cache', expiration: { maxAgeSeconds: 86400 } },
          },
          {
            urlPattern: /\/api\/categories/,
            handler: 'NetworkFirst',
            options: { cacheName: 'categories-cache', expiration: { maxAgeSeconds: 86400 } },
          },
          {
            urlPattern: /\/api\/settings/,
            handler: 'NetworkFirst',
            options: { cacheName: 'settings-cache', expiration: { maxAgeSeconds: 86400 } },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
