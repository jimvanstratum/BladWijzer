import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

// GitHub Pages basename; override in CI via VITE_BASE if hosting elsewhere.
const base = process.env.VITE_BASE ?? '/BladWijzer/';

export default defineConfig({
  base,
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icon.svg', 'wordlogo.svg'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2,json}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/(upload\.wikimedia\.org|commons\.wikimedia\.org)\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'wikimedia-images',
              expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/[a-z]+\.wikipedia\.org\/api\/rest_v1\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'wikipedia-api',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
      manifest: {
        name: 'BladWijzer',
        short_name: 'BladWijzer',
        description: 'Persoonlijke plantenapp voor binnen en buiten, met snoei-inzicht.',
        theme_color: '#3e5641',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: base,
        scope: base,
        lang: 'nl',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
});
