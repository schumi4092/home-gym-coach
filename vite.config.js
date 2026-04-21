import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg'],
      manifest: {
        name: 'Home Gym Coach',
        short_name: 'Workout',
        description: 'Personal training journal — sessions, history, coaching cues.',
        theme_color: '#14130f',
        background_color: '#f5f1e8',
        display: 'standalone',
        start_url: './',
        scope: './',
        icons: [
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg}'],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
  server: {
    host: '127.0.0.1',
    port: 8765,
    strictPort: true,
  },
  preview: {
    host: '127.0.0.1',
    port: 8765,
    strictPort: true,
  },
})
