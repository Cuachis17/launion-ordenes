import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  // El front habla con el API por su propio origen (/api) y Vite lo reenvía al
  // servidor. Así desaparece el CORS, la cookie de sesión deja de ser
  // entre-orígenes, y la app funciona igual desde el teléfono en la red local
  // (donde 'localhost' apuntaría al propio teléfono y no al servidor).
  server: {
    proxy: {
      '/api': { target: 'http://localhost:3021', changeOrigin: true },
      '/uploads': { target: 'http://localhost:3021', changeOrigin: true },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        // Nunca cachear el API: una respuesta guardada de /api/verify deja la
        // sesión en un estado que no corresponde con la realidad.
        navigateFallbackDenylist: [/^\/api/, /^\/uploads/],
        runtimeCaching: [],
      },
      includeAssets: ['favicon.svg', 'robots.txt', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-512-maskable.png'],
      manifest: {
        name: 'La Union - Reservas',
        short_name: 'LaUnion',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#4f46e5',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      }
    })
  ],
})
